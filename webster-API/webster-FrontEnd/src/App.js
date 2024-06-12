import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Box from '@mui/material/Box'

import Layout from './components/Layout';
import Register from './components/Main/Auth/Register';
import Auth from './components/Main/Auth/Auth';
import Recover from './components/Main/Auth/Recover';
import RecoverForm from './components/Main/Auth/RecoverForm';
import Confirm from './components/Main/Auth/Confirm';
import UserProfile from './components/Main/User/UserProfile';
import ErrorPage from './components/Main/ErrorPage';
import ImageRedactor from "./components/Main/Image/ImageRedactor";
import AllEvents from "./components/Main/Image/AllEvents";

function App() {
  return (
    <Router>
      <Box>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Auth />}/>
            <Route path="/register" element={<Register />}/>
            <Route path="/recover" element={<Recover />}/>
            <Route path="/confirm/:token" element={<Confirm />} />
            <Route path="/reset-password/:token" element={<RecoverForm />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/profile/0" element={<Auth />} />
            <Route path="*" element={<ErrorPage />}/>
            <Route path="/image" element={<ImageRedactor />}/>
            <Route path="/image/:imageNameParam" element={<ImageRedactor/>} />
            <Route path="/saved" element={<AllEvents />} />
           </Route>
        </Routes>
      </Box>
    </Router>
  );
}

export default App;