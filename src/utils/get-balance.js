export function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    return operation.type === "credit"
      ? acc + operation.amount
      : acc - operation.amount;
  }, 0);
}
