import "server-only";

import type { Employee } from "@/types";

type ThreeCxTokenResponse = {
  access_token?: string;
};

export class ThreeCxPhoneProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThreeCxPhoneProviderError";
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ThreeCxPhoneProviderError(`Missing ${name}.`);
  }

  return value;
}

function getThreeCxConfig() {
  return {
    baseUrl: getRequiredEnv("THREECX_BASE_URL").replace(/\/+$/, ""),
    clientId: getRequiredEnv("THREECX_CLIENT_ID"),
    apiKey: getRequiredEnv("THREECX_API_KEY"),
    controlExtension: getRequiredEnv("THREECX_CONTROL_EXTENSION"),
  };
}

async function getAccessToken() {
  const config = getThreeCxConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.apiKey,
    grant_type: "client_credentials",
  });

  const response = await fetch(`${config.baseUrl}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new ThreeCxPhoneProviderError(
      `3CX authentication failed with status ${response.status}.`
    );
  }

  const tokenResponse = (await response.json()) as ThreeCxTokenResponse;

  if (!tokenResponse.access_token) {
    throw new ThreeCxPhoneProviderError("3CX authentication returned no token.");
  }

  return { accessToken: tokenResponse.access_token, config };
}

export async function callEmployeeWithThreeCx(employee: Employee) {
  const { accessToken, config } = await getAccessToken();
  const response = await fetch(
    `${config.baseUrl}/callcontrol/${encodeURIComponent(
      config.controlExtension
    )}/makecall`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination: employee.phone_extension,
      }),
    }
  );

  if (!response.ok) {
    throw new ThreeCxPhoneProviderError(
      `3CX makecall failed with status ${response.status}.`
    );
  }
}
