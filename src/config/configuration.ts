export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});
