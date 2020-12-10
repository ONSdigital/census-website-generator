export default function assertEnvVariables(variableNames) {
  for (let key of variableNames) {
    if (process.env[key] === undefined) {
      throw new Error(`Missing environment variable '${key}'!`);
    }
  }
}
