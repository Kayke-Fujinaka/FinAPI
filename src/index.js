import express from "express";
import { randomUUID } from "node:crypto";

const app = express();

app.use(express.json());

const customers = [];

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer)
    return response.status(404).json({ error: "Customer not found!" });

  request.customer = customer;

  return next();
}

// Criação de conta
app.post("/account", (request, response) => {
  const { name, cpf } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists)
    return response.status(400).json({ error: "Customer already exists!" });

  customers.push({
    id: randomUUID(),
    name,
    cpf,
    statement: [],
  });

  return response.status(201).send();
});

// Buscar o extrato bancário do cliente
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

// Realizarum depósito
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.listen(3333);
