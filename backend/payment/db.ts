import { SQLDatabase } from "encore.dev/storage/sqldb";

export const paymentDB = new SQLDatabase("payment", {
  migrations: "./migrations",
});
