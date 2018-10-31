import { fetchingData, fetchingDataFinished } from './CommonActions'
import { getInfo } from '../services/UserService'

export const checkLoginAction = () => dispatch => {
    let user = JSON.parse(localStorage.getItem("user"));
    let logged = true;
    if (!user) {
        user = '';
        logged = false;
    }
    dispatch({
        type: 'CHECK_LOGIN_ACTION',
        data: user,
        logged
    });
}

export const loginAction = (username, pass) => dispatch => {
    dispatch(fetchingData());
    let token = btoa(`${username}:${pass}`); 
    console.log('chegou aqui')
    getInfo(token)
    .then(data => {
        data.name = data.fullName.split(' ')[0];
        dispatch({
            type: 'LOGIN_ACTION',
            data, 
            logged: true
        });
        localStorage.setItem("token", JSON.stringify(token));
        localStorage.setItem("user", JSON.stringify(data));
        dispatch(fetchingDataFinished());
    })
    .catch(err => {
        dispatch(fetchingDataFinished());
    });
}

export const logoutAction = () => dispatch => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    dispatch({
        type: 'LOGOUT_ACTION'
    })
}