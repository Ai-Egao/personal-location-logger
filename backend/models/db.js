import sql from 'mssql';

const config = {
    server: "DESKTOP-0U81Q4V",
    database: 'LocationLoggerDB',
    port: 1433,
    user: 'nodeuser',
    password: 'Node@1234',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

export const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log('Connected to SQL Server');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
};

export { sql };