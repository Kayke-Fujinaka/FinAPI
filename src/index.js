import express from "express";
import { randomUUID } from "node:crypto";

const app = express();

app.use(express.json());

const customers = [];

// Criação de conta
app.post("/account", (request, response) => {
  const { name, CPF } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.CPF === CPF
  );

  if (customerAlreadyExists)
    return response.status(400).json({ error: "Customer already exists!" });

  customers.push({
    id: randomUUID(),
    name,
    CPF,
    statement: [],
  });

  return response.status(201).send();
});

// Buscar o extrato bancário do cliente
app.get("/statement/:CPF", (request, response) => {
  const { CPF } = request.params;

  const customer = customers.find((customer) => customer.CPF === CPF);

  if (!customer)
    return response.status(404).json({ error: "Customer not found!" });

  return response.json(customer.statement);
});

app.listen(3333);
