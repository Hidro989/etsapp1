import mongoose from 'mongoose';

export class Database {
    static url = `${process.env.DB_CONNECTION}://${process.env.DB_HOST}:${process.env.DB_PORT}`;
    static authSource = process.env.DB_AUTHENTICATION_DATABASE;
    static user = process.env.DB_USERNAME;
    static password = process.env.DB_PASSWORD;
    static databaseName = process.env.DB_DATABASE;
    static isConnected = false;

    static connect = async () => {
        if (this.isConnected) {
            return;
        }
        try {
            await mongoose.connect(this.url, {
                user: this.user,
                pass: this.password,
                dbName: this.databaseName,
                authSource: this.authSource
            });
            if (mongoose.connection.readyState === 1) {
                this.isConnected = true;
            } else {
                console.error('MongoDB connection error: Connection state is not ready');
            }
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            throw error;
        }
    }

    static disconnect = async () => {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
        } catch (error) {
            console.error('MongoDB disconnection error:', error.message);
            throw error;
        }
    }
}
