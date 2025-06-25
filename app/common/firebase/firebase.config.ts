import admin from 'firebase-admin';
import serviceAccount from './fesensi-99d94-firebase-adminsdk-fbsvc-ca337104b8.json';

admin.initializeApp({
 credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});
export default admin;
