export const SERVER_PORT = process.env.SERVER_PORT || 5000;
export const OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://localhost:4443';
export const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';
export const CALL_OPENVIDU_CERTTYPE = process.env.CALL_OPENVIDU_CERTTYPE || 'selfsigned';
export const ADMIN_SECRET = process.env.ADMIN_SECRET || OPENVIDU_SECRET;
export const RECORDING = process.env.RECORDING || 'ENABLED';
