import axios from 'axios';

const flaskServiceUrl = process.env.FLASK_BASE_URL;

export const queryFlaskServer = (model_name: string, message: string, conversation_id: string) => {
    return axios.post(`${flaskServiceUrl}/query`, { model_name, message, conversation_id });
};
