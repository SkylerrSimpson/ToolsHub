export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const sessionRequired = () =>
  new ApiError(401, "Reload this tool to start a private browser session.");
