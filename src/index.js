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

function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    return operation.type === "credit"
      ? acc + operation.amount
      : acc - operation.amount;
  }, []);
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

// Realizar um depósito
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

// Realizar um saque
app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;

  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

// Buscar extrato do cliente por data
app.get("/statementByDate", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );
  return response.json(statement);
});

// Atualizar dados do cliente
app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body;

  const { customer } = request;

  customer.name = name;

  return response.status(204).send();
});

// Obter Informações do Cliente
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

// Deletar Cliente
app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(204).send();
});

// Obter o Saldo
app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (Array.isArray(balance)) return response.json({ balance: 0 });

  return response.json({ balance });
});

app.listen(3333);
