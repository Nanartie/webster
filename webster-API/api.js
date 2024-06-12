import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import {setHash, generateToken, findUser, saveUser} from './utils.js'
import db from './db.js'
import fs from 'fs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
	  cb(null, 'uploads/fonts');
	},
	filename: function (req, file, cb) {
	  cb(null, file.originalname);
	},
});

const upload = multer({ storage: storage });

const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(404).json({ message: 'Token not found' });
		}
		const token = authHeader.split(' ')[1];
		const decoded = verifyToken(token);

		const userId = decoded.userId;
        const userFolderPath = path.join(__dirname, 'userImages', `${userId}`);

        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath, { recursive: true });
        }

        cb(null, userFolderPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});


const uploadAvatar = multer({ storage: avatarStorage });
const uploadImage = multer({ storage: imageStorage });

const app = express();
const PORT = process.env.PORT || 3000;
const secretKey = generateToken();
console.log("Секретный ключ: " + secretKey);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/post_files', express.static('post_files'));
app.use('/userImages', express.static('userImages'));
app.use('/backgrounds', express.static('backgroundss'));
app.use('/images_without_background', express.static('images_without_background'));
app.use('/images_without_background', express.static('images_without_background'));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	service: 'gmail',
	auth: {
		user: 'usof.propaganda@gmail.com',
		pass: 'ftfn zdhe dbit fkep'
	}
});

const verifyToken = (token) => {
	try {
	  return jwt.verify(token, secretKey);
	} catch (err) {
	  console.error('Ошибка проверки токена:', err);
	  throw new Error('Недействительный токен');
	}
};

async function saveImageToDatabase(name, userId) {
	try {
		const [existingFiles] = await db.promise().query(
			'SELECT image_id FROM images WHERE name = ?',
            [name]
        );

        if (!existingFiles.length > 0) {
			try {
				const [rows] = await db.promise().query(
					'INSERT INTO images (name, user_id, date) VALUES (?, ?, ?)',
					[name, userId, new Date()]
				);
				return rows.insertId;
			} catch (error) {
				console.error('Ошибка при сохранении изображения в базе данных:', error);
				throw error;
			}
        }

	} catch (error) {
	  console.error('Ошибка при сохранении изображения в базе данных:', error);
	  throw error;
	}
}

async function saveFontToDatabase(filename, userId) {
	try {
		try {
			const [rows] = await db.promise().query(
			'INSERT INTO fonts (filename, user_id) VALUES (?, ?)',
			[filename, userId]
			);
			return rows.insertId;
		} catch (error) {
			console.error('Ошибка при сохранении шрифта в базе данных:', error);
			throw error;
		}
	} catch (error) {
	  console.error('Ошибка при сохранении шрифта в базе данных:', error);
	  throw error;
	}
  }

app.post('/api/auth/register', async (req, res) => {
	const { login, email, password, password_confirmation } = req.body;

	try {
		const existingUser = await findUser(`login = '${login}' OR email = '${email}'`);
		if (existingUser) {
			return res.status(400).json({ message: 'User with such username or email already exist' });
		}
		if (password_confirmation != password) {
			return res.status(400).json({ message: 'Passwords does not match' });
		}
		if (password.length < 8) {
			return res.status(400).json({ message: 'The password must contain at least 8 characters' });
		}

		if (!/\d/.test(password)) {
			return res.status(400).json({ message: 'The password must contain at least one number' });
		}

		if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
			return res.status(400).json({ message: 'The password must contain upper and lower case letters' });
		}

		if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
			return res.status(400).json({ message: 'The password must contain at least one special character' });
		}
		const hashedPass = setHash(password); 
		const newUser = await saveUser(login, email, hashedPass);
		const confirmToken = generateToken();
		await db.promise().query(
			'UPDATE users SET confirm_token = ? WHERE user_id = ?',
			[confirmToken, newUser.user_id]
		);
		const mailOptions = {
			from: 'webster.propaganda@gmail.com',
			to: email,
			subject: 'webster: Email confirmation',
			html: `
				<div style="background-color: #f2f2f2; color: #333; padding: 20px; border-radius: 10px; width: 400px; margin: 0 auto;">
					<h1 style="text-align: center; margin-bottom: 20px;">webster: Email confirmation</h1>
					<p style="text-align: center;">Click the button below to confirm your email:</p>
					<div style="text-align: center;">
						<a href="http://localhost:3001/confirm/${confirmToken}" style="display: inline-block; background-color: black; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Confirm</a>
					</div>
				</div>
			`
		};
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.error('Email not sent:', error);
			} else {
				console.log('Email sent: ' + info.response);
			}
		});

		res.status(200).json({ message: 'Registration successfull' });
	} catch (error) {
		console.error('Error during registration:', error);
		res.status(500).json({ message: 'Error during registration' });
	}
});

app.get('/api/auth/confirm/:token', async (req, res) => {
	const { token } = req.params;
	try {
		const [result, _] = await db.promise().query(`SELECT * FROM users WHERE confirm_token = ?`, [token]);
		if (result.length === 0) {
			return res.status(400).send({ message: 'Invalid token' });
		}

		const userId = result[0].user_id;
		await db.promise().query('UPDATE users SET confirmed = 1, confirm_token = NULL WHERE user_id = ?', [userId]);


		console.log(typeof String.toString(userId));
		const userFolderPath = path.join(__dirname, 'userImages', `${userId}`);
		if (!fs.existsSync(userFolderPath)) {
			fs.mkdirSync(userFolderPath, { recursive: true });
			console.log(`Папка для пользователя ${userId} создана.`);
		} else {
			console.log(`Папка для пользователя ${userId} уже существует.`);
		}

		return res.status(200).send({ message: 'Email successfully confirmed' });
	} catch (error) {
		console.error('Error during email confirmation:', error);
		res.status(500).json({ message: 'Error during email confirmation' });
	}
});


app.post('/api/auth/password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await findUser(`email = '${email}' AND confirmed = 1`);
        if (!user) {
            return res.status(400).json({ message: 'User with email address not found or email not verified' });
        } else {

        const confirmToken = generateToken();

        await db.promise().query(
            'UPDATE users SET confirm_token = ? WHERE user_id = ?',
            [confirmToken, user.user_id]
        );

        const mailOptions = {
			from: 'webster.propaganda@gmail.com',
			to: email,
			subject: 'webster: Password reset',
			html: `
				<div style="background-color: #f2f2f2; color: #333; padding: 20px; border-radius: 10px; width: 400px; margin: 0 auto;">
					<h1 style="text-align: center; margin-bottom: 20px;">webster: Password reset</h1>
					<p style="text-align: center;">Click the button below to reset your password:</p>
					<div style="text-align: center;">
						<a href="http://localhost:3001/reset-password/${confirmToken}" style="display: inline-block; background-color: black; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Reset Password</a>
					</div>
				</div>
			`
		};

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error durind sending the email:', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.status(200).json({ message: 'A password reset link has been sent to your email' });
	}
    } catch (error) {
        console.error('An error occurred while recovering your password:', error);
        res.status(500).json({ message: 'An error occurred while recovering your password' });
    }
});

app.post('/api/auth/password-reset/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    try {
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'The password must contain at least 8 characters' });
        }
  
        if (!/\d/.test(newPassword)) {
            return res.status(400).json({ message: 'The password must contain at least one number' });
        }
  
        if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ message: 'The password must contain upper and lower case letters' });
        }
  
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            return res.status(400).json({ message: 'The password must contain at least one special character' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const [result, _] = await db.promise().query(`SELECT * FROM users WHERE confirm_token = ?`, [token]);
        if (result.length === 0) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        const userId = result[0].user_id;
        const hashedPass = setHash(newPassword);

		if (result[0]['2fa_active']) {
			const decryptedKey = decrypt(result[0]['2fa_key'], result[0].password);
			const newKey = encrypt(decryptedKey, hashedPass);
			await db.promise().query('UPDATE users SET password = ?, 2fa_key = ?, confirm_token = NULL WHERE user_id = ?', [hashedPass, newKey, userId]);
		} else {
			await db.promise().query('UPDATE users SET password = ?, confirm_token = NULL WHERE user_id = ?', [hashedPass, userId]);
		}

        return res.status(200).json({ message: 'Password successfully reset' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Error during password reset' });
    }
});

app.post('/api/auth/login', async (req, res) => {
	const { username, password, '2faToken': twoFactorToken } = req.body;
  
	try {
		const user = await findUser(`login = '${username}' OR email = '${username}'`);

		if (!user.confirmed) {
			return res.status(400).json({ message: 'Email not confirmed' });
		}

		if (!user || !bcrypt.compareSync(password, user.password)) {
			return res.status(400).json({ message: 'Passwords do not match' });
		}
  
		if (user["2fa_active"]) {
			if (!twoFactorToken) {
				return res.status(200).json({ message: 'Two-factor authentication required', requires2FA: true });
			} else {
				const secretKey = decrypt(user['2fa_key'], user.password);

				const verified = speakeasy.totp.verify({
					secret: secretKey,
					encoding: 'hex',
					token: twoFactorToken
				});
		
				if (!verified) {
					return res.status(400).json({ message: 'Invalid two-factor authentication token' });
				}
			}
	  	}
  
		const payload = {
			userId: user.user_id,
			username: user.login,
		};
		console.log(payload);
		const options = {
			expiresIn: '24h',
		};
	
		const jwtToken = jwt.sign(payload, secretKey, options);
	
		res.status(200).json({ message: 'Authorization success', user: { userId: user.user_id, jwtToken: jwtToken } });
	} catch (error) {
		console.error('Error during the authorization:', error);
		res.status(500).json({ message: 'Error during the authorization' });
	}
});  

app.post('/api/auth/logout', async (req, res) => {
	try {
    	const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(404).json({ message: 'Token not found' });
		}

    	const token = authHeader.split(' ')[1];

		try {
			const decoded = verifyToken(token);
			const userId = decoded.userId;
			
			const user = await findUser(`user_id = ${userId}`);
			if (!user) {
				return res.status(404).json({ message: 'User not found' });
			}

			return res.status(200).json({ message: 'Logout user' });
		} catch (error) {
			console.error('Error during logout user:', error);
			return res.status(401).json({ message: 'Error during the  logout user' });
		}
	} catch (error) {
		console.error('Error during logout user:', error);
		return res.status(500).json({ message: 'Error during the logout user' });
	}
});

app.get('/api/users', async (req, res) => {
	try {
		const [users, _] = await db.promise().query(`SELECT user_id, login, full_name, email, avatar FROM users`);
		const filteredUsers = users.filter(user => user.full_name !== 'Deleted user');

    	res.status(200).json(filteredUsers);
	} catch (error) {
		console.error('Ошибка во время получения списка пользователей: ', error);
		return res.status(500).json({message: 'Произошла ошибка во время получения списка пользователей'});
	}
});

app.get('/api/users/:userId', async (req, res) => {
	const { userId } = req.params;

	try {
		const [userResult, _] = await db.promise().query(`SELECT user_id, login, full_name, email, avatar, 2fa_active FROM users WHERE user_id = ${userId}`);
		if (!userResult[0]) {
		return res.status(404).json({ message: 'Пользователь не найден' });
		}

        const userData = {
            ...userResult[0],
        };

		return res.status(200).json(userData);
	} catch (error) {
		console.error('Ошибка получения данных пользователя:', error);
		return res.status(500).json({ message: 'Произошла ошибка при получении данных пользователя' });
	}
});

const updateUser = async (userId, fullName, login, email) => {
  await db.promise().query('UPDATE users SET full_name = ?, login = ?, email = ? WHERE user_id = ?', [fullName, login, email, userId]);
};

app.patch('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, email, login } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      	return res.status(404).json({ message: 'Токен не найден' });
    }

    const token = authHeader.split(' ')[1];
	const decoded = verifyToken(token);
    try {
		const user = await findUser(`user_id = '${userId}'`);
		if (!user) {
			return res.status(404).json({ message: 'Пользователь не найден' });
		}

		const jwtUserProfileToken = decoded.profileToken;
		if (user.profile_token !== jwtUserProfileToken) {
			return res.status(403).json({ message: 'Недостаточно прав для редактирования профиля' });
		}

		if (!email || !login) {
			return res.status(400).json({ message: 'Пожалуйста, предоставьте данные для обновления' });
		}

		await updateUser(userId, fullName, login, email);

		return res.status(200).json({ message: 'Данные пользователя успешно обновлены' });
    } catch (error) {
      	return res.status(500).json({ message: 'Произошла ошибка при обновлении данных пользователя' });
    }
  } catch (error) {
		console.error('Ошибка при обновлении данных пользователя:', error);
		return res.status(401).json({ message: 'Недействительный токен' });
  }
});

app.post('/api/users/edit', async (req, res) => {
	try {
		const {userId, profileToken} = req.body;
		const authHeader = req.headers.authorization;
		const token = authHeader.split(' ')[1];
		const user = await findUser(`user_id = '${userId}'`);
		const decoded = verifyToken(token);
		try {

			if (!user) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}
			const jwtUserProfileToken = decoded.profileToken;
			if (user.profile_token !== jwtUserProfileToken) {
				return res.status(403).json({ message: 'Недостаточно прав для редактирования профиля' });
			}
			return res.status(200).json({ message: 'Доступ разрешён' });
		} catch (error) {
			return res.status(500).json({message: 'Произошла ошибка при получении доступа к редактированию профиля'});
		}
	}  catch (error) {
		console.error('Ошибка при получении доступа к редактированию профиля:', error);
		return res.status(401).json({ message: 'Недействительный токен' });
	}
});

app.patch('/api/users/update/avatar', uploadAvatar.single('avatar'), async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		const avatar = req.file;
		const token = authHeader.split(' ')[1];
		const decoded = verifyToken(token);
		const userId = decoded.userId;
		const target = req.headers.target;

		try {
			const user = await findUser(`user_id = '${userId}'`);
			if (!user) {
				return res.status(404).json({ message: 'Пользователь не найден' });
			}

			if (target != user.user_id) {
				return res.status(403).json({ message: 'Недостаточно прав для редактирования профиля' });
			}

			if (!avatar) {
				return res.status(400).json({ message: 'Файл аватара не найден' });
			}
			const avatarPath = `uploads/${avatar.originalname}`;

			await db.promise().query('UPDATE users SET avatar = ? WHERE user_id = ?', [avatarPath, userId]);

			return res.status(200).json({ success: true });
		} catch(error) {
			console.error('Ошибка при обновлении данных пользователя:', error);
			return res.status(500).json({ message: 'Произошла ошибка при обновлении данных пользователя' });
		}
	} catch(error) {
		console.error('Ошибка при обновлении данных пользователя:', error);
		return res.status(401).json({ message: 'Недействительный токен' });
	}
});

app.get('/api/search/users', async (req, res) => {
	try {
		const searchTerm = req.query.search;

		if(searchTerm == null || searchTerm == '') {
			return res.status(404).json({message: 'User not found'});
		}
		const [usersResult] = await db.promise().query('SELECT user_id, login, full_name, email, avatar FROM users WHERE login LIKE ?',[`%${searchTerm}%`]);

		const filteredUsers = usersResult.filter(user => user.full_name !== 'Deleted user');

		return res.status(200).json({ list: filteredUsers });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Failed to fetch searched user' });
	}
});

app.get('/api/search/events', async (req, res) => {
	try {
	  const searchTerm = req.query.search;
  
	  if (!searchTerm || searchTerm.trim() === '') {
		return res.status(404).json({ message: 'Event not found' });
	  }
  
	  const [eventsResult] = await db.promise().query(`
		SELECT event_id, event_name, description, banner
		FROM events
		WHERE event_name LIKE ?
	  `, [`%${searchTerm}%`]);
  
	  return res.status(200).json({ list: eventsResult });
	} catch (error) {
	  console.error(error);
	  return res.status(500).json({ message: 'Failed to fetch searched events' });
	}
});  

function encrypt(text, encryptKey) {
    const cipher = crypto.createCipher('aes-256-cbc', encryptKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedText, encryptKey) {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

app.get('/api/2fa/create/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(404).json({ message: 'Token not found' });
		}

    	const token = authHeader.split(' ')[1];
		const decoded = verifyToken(token);
		const tokenUserId = decoded.userId;
		if (parseInt(tokenUserId) !== parseInt(userId)) {
			return res.status(403).json({ message: 'Forbidden' });
		}

		const user = await findUser(`user_id = ${userId}`);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		if (user['2fa_active']) {
			return res.status(400).json({ message: 'Two-factor authentication is already active' });
		}

        const secret = speakeasy.generateSecret({
            name: `webster: ${user.login}`
        });

        const encryptedSecret = encrypt(secret.hex, user.password);

        qrcode.toDataURL(secret.otpauth_url)
            .then(finalQr => {
                res.status(200).json({ qrCodeUrl: finalQr });
            })
            .catch(error => {
                console.error('Error during QR code generation:', error);
                res.status(500).json({ error: 'Error during QR code generation' });
            });

        await db.promise().query('UPDATE users SET 2fa_key = ? WHERE user_id = ?', [encryptedSecret, userId]);
	}catch (error) {
		console.error('Error during creating qr:', error);
		res.status(500).json({ error: 'Error during creating qr' });
	}
});

app.post('/api/2fa/activate/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const authHeader = req.headers.authorization;
	
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(404).json({ message: 'Token not found' });
		}
	
		const token = authHeader.split(' ')[1];
		const decoded = verifyToken(token);
		const tokenUserId = decoded.userId;
		if (parseInt(tokenUserId) !== parseInt(userId)) {
			return res.status(403).json({ message: 'Forbidden' });
		}
	
		const user = await findUser(`user_id = ${userId}`);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
	
		if (user['2fa_active']) {
			return res.status(400).json({ message: 'Two-factor authentication is already active' });
		}

        const secretKey = decrypt(user['2fa_key'], user.password);

        const verified = speakeasy.totp.verify({
            secret: secretKey,
            encoding: 'hex',
            token: req.body.token
        });
	
		if (verified) {
			await db.promise().query('UPDATE users SET 2fa_active = true WHERE user_id = ?', [userId]);
	
			return res.status(200).json({ message: 'Two-factor authentication successfully activated' });
		} else {
			return res.status(400).json({ message: 'Invalid one-time password' });
		}
	} catch (error) {
		console.error('Error during activating 2FA:', error);
		return res.status(500).json({ error: 'Error during activating 2FA' });
	}
});

app.post('/api/uploadImage', uploadImage.single('imageFile'), async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(404).json({ message: 'Token not found' });
	}
	const token = authHeader.split(' ')[1];
	const decoded = verifyToken(token);
	try {
		const userId = decoded.userId;
		const { originalname } = req.file;
		await saveImageToDatabase(originalname, userId);
		res.json({ message: 'Image uploaded successfully.' });
	} catch (error) {
	  console.error('Failed to load the image:', error);
	  res.status(500).json({ error: 'Failed to load the image.' });
	}
  });


app.post('/api/uploadFont', upload.single('fontFile'), async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(404).json({ message: 'Token not found' });
	}
	const token = authHeader.split(' ')[1];
	const decoded = verifyToken(token);
	try {
		const userId = decoded.userId;
		const { originalname } = req.file;
		await saveFontToDatabase(originalname, userId);
		res.json({ message: 'Font uploaded successfully.' });
	} catch (error) {
	  console.error('Failed to load the font:', error);
	  res.status(500).json({ error: 'Failed to load the font.' });
	}
  });

app.get('/api/fonts', async(req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(404).json({ message: 'Token not found' });
	}
	const token = authHeader.split(' ')[1];
	const decoded = verifyToken(token);
	try {
		const userId = decoded.userId; 
		const query = `
		SELECT DISTINCT filename
		FROM fonts
		WHERE user_id = ?;
		`;
	
		const [results] = await db.promise().query(query, [userId]);
		const filenames = results.map(row => row.filename.split('.')[0]);

        res.status(200).json(filenames);
	} catch (error) {
		console.error('Failed to load the font:', error);
		res.status(500).json({ error: 'Failed to load the font.' });
 	}
});

app.get('/api/images', uploadImage.single('imageFile'), async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const perPage = parseInt(req.query.perPage) || 10;
	const offset = (page - 1) * perPage;
  
	const date = req.query.date || '';
  
	try {
	  let query = 'SELECT * FROM images ';
	  let queryValues = [];
  
	  if (date !== '') {
		query += 'WHERE DATE(date) = ? ';
		queryValues.push(date);
	  }
  
	  query += 'ORDER BY date DESC ';
	  query += 'LIMIT ? OFFSET ?';
  
	  queryValues.push(perPage);
	  queryValues.push(offset);
  
	  const [images, _] = await db.promise().query(query, queryValues);
	  res.status(200).json(images);
	} catch (error) {
	  console.error('Ошибка во время получения списка изображений: ', error);
	  return res.status(500).json({ message: 'Произошла ошибка во время получения списка изображений' });
	}
});  

app.listen(PORT, () => {
	console.log(`API is running on port ${PORT}`);
});