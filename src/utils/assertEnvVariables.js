export default function assertEnvVariables(variableNames) {
  for (let key of variableNames) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable '${key}'!`);
    }
  }
}
