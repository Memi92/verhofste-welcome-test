import "server-only";

type ThreeCxTokenResponse = {
  access_token?: string;
};

export type PhoneCallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "failed";

type ThreeCxParticipant = {
  id?: number | string;
  callid?: number | string;
  callId?: number | string;
  call_id?: number | string;
  legid?: number | string;
  legId?: number | string;
  leg_id?: number | string;
  status?: string;
  dn?: string;
  party_dn?: string;
  party_caller_id?: string;
  direct_control?: boolean;
  [key: string]: unknown;
};

type ThreeCxCallControlResponse = {
  participants?: ThreeCxParticipant[];
};

export type PhoneCallDestination = {
  phone_extension: string;
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

async function getCallControlState() {
  const { accessToken, config } = await getAccessToken();
  const response = await fetch(
    `${config.baseUrl}/callcontrol/${encodeURIComponent(
      config.controlExtension
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new ThreeCxPhoneProviderError(
      `3CX status lookup failed with status ${response.status}.`
    );
  }

  const callControlResponse =
    (await response.json()) as ThreeCxCallControlResponse;

  return {
    accessToken,
    config,
    participants: callControlResponse.participants ?? [],
  };
}

export async function callDestinationWithThreeCx(destination: string) {
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
        destination,
      }),
    }
  );

  if (!response.ok) {
    throw new ThreeCxPhoneProviderError(
      `3CX makecall failed with status ${response.status}.`
    );
  }
}

function statusTextIncludes(status: string, words: string[]) {
  const normalizedStatus = status.toLowerCase();

  return words.some((word) => normalizedStatus.includes(word));
}

function getParticipantId(participant: ThreeCxParticipant) {
  return participant.id == null ? null : String(participant.id);
}

function getParticipantCallId(participant: ThreeCxParticipant) {
  const callId = participant.callid ?? participant.callId ?? participant.call_id;

  return callId == null ? null : String(callId);
}

function matchesExtension(value: string | undefined, extension: string) {
  if (!value) {
    return false;
  }

  return value === extension || value.includes(extension);
}

function isEmployeeParticipant(
  participant: ThreeCxParticipant,
  destination: PhoneCallDestination
) {
  return [participant.dn, participant.party_dn, participant.party_caller_id].some(
    (value) => matchesExtension(value, destination.phone_extension)
  );
}

function isActiveParticipant(participant: ThreeCxParticipant) {
  const status = participant.status ?? "";

  return !statusTextIncludes(status, [
    "ended",
    "terminated",
    "disconnected",
    "failed",
  ]);
}

function findControlParticipant(
  participants: ThreeCxParticipant[],
  controlExtension: string
) {
  const activeParticipants = participants.filter(
    (participant) =>
      getParticipantId(participant) && isActiveParticipant(participant)
  );

  return (
    activeParticipants.find((participant) => participant.dn === controlExtension) ??
    activeParticipants.find((participant) => participant.direct_control) ??
    activeParticipants[0] ??
    null
  );
}

function getRelevantActiveParticipants(
  participants: ThreeCxParticipant[],
  controlExtension: string,
  destination?: PhoneCallDestination
) {
  const activeParticipants = participants.filter(
    (participant) => getParticipantId(participant) && isActiveParticipant(participant)
  );

  if (!destination) {
    const participant = findControlParticipant(participants, controlExtension);

    return participant ? [participant] : [];
  }

  const destinationParticipants = activeParticipants.filter((participant) =>
    isEmployeeParticipant(participant, destination)
  );
  const destinationCallIds = new Set(
    destinationParticipants
      .map(getParticipantCallId)
      .filter((callId): callId is string => Boolean(callId))
  );

  if (destinationCallIds.size > 0) {
    return activeParticipants
      .filter(
        (participant) =>
          getParticipantCallId(participant) !== null &&
          destinationCallIds.has(getParticipantCallId(participant)!)
      )
      .sort((first, second) => {
        if (first.dn === controlExtension) {
          return 1;
        }

        if (second.dn === controlExtension) {
          return -1;
        }

        return 0;
      });
  }

  if (destinationParticipants.length > 0) {
    return activeParticipants.filter(
      (participant) =>
        destinationParticipants.includes(participant) ||
        matchesExtension(participant.dn, controlExtension) ||
        participant.direct_control
    );
  }

  return activeParticipants.filter(
    (participant) =>
      matchesExtension(participant.dn, controlExtension) ||
      participant.direct_control
  );
}

function getParticipantDebugSnapshot(participant: ThreeCxParticipant) {
  return {
    id: participant.id,
    status: participant.status,
    dn: participant.dn,
    party_dn: participant.party_dn,
    party_caller_id: participant.party_caller_id,
    callid: participant.callid,
    callId: participant.callId,
    call_id: participant.call_id,
    legid: participant.legid,
    legId: participant.legId,
    leg_id: participant.leg_id,
    direct_control: participant.direct_control,
    keys: Object.keys(participant),
  };
}

function logParticipantDebug(
  label: string,
  participants: ThreeCxParticipant[]
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info(
    `[3cx] ${label}`,
    participants.map(getParticipantDebugSnapshot)
  );
}

function mapParticipantsToStatus(
  participants: ThreeCxParticipant[],
  destination: PhoneCallDestination
): PhoneCallStatus {
  if (participants.length === 0) {
    return "idle";
  }

  const relevantParticipants = participants.filter((participant) =>
    isEmployeeParticipant(participant, destination)
  );
  const participantsToInspect =
    relevantParticipants.length > 0 ? relevantParticipants : participants;
  const statuses = participantsToInspect.map(
    (participant) => participant.status ?? ""
  );

  if (
    statuses.some((status) =>
      statusTextIncludes(status, [
        "connected",
        "talking",
        "answered",
        "established",
      ])
    )
  ) {
    return "connected";
  }

  if (
    statuses.some((status) =>
      statusTextIncludes(status, ["ringing", "ring", "alerting"])
    )
  ) {
    return "ringing";
  }

  if (
    statuses.some((status) =>
      statusTextIncludes(status, ["dialing", "calling", "trying", "pending"])
    )
  ) {
    return "calling";
  }

  if (
    statuses.some((status) =>
      statusTextIncludes(status, ["ended", "terminated", "disconnected"])
    )
  ) {
    return "ended";
  }

  return "calling";
}

export async function getThreeCxPhoneCallStatus(
  destination: PhoneCallDestination
) {
  const { participants } = await getCallControlState();

  return mapParticipantsToStatus(participants, destination);
}

async function dropParticipant(
  accessToken: string,
  baseUrl: string,
  controlExtension: string,
  participantId: string
) {
  const endpointPath = `/callcontrol/${encodeURIComponent(
    controlExtension
  )}/participants/${encodeURIComponent(String(participantId))}/drop`;
  const response = await fetch(
    `${baseUrl}${endpointPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok && response.status !== 404) {
    const responseText = await response.text().catch(() => "");

    console.error("[3cx] Participant drop failed", {
      endpointPath,
      participantId,
      status: response.status,
      responseText,
    });

    throw new ThreeCxPhoneProviderError(
      `3CX call drop failed with status ${response.status}.`
    );
  }
}

export async function endThreeCxPhoneCall(destination?: PhoneCallDestination) {
  const { accessToken, config, participants } = await getCallControlState();
  let currentParticipants = participants;

  logParticipantDebug("participants before drop", currentParticipants);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const participantsToDrop = getRelevantActiveParticipants(
      currentParticipants,
      config.controlExtension,
      destination
    );

    if (participantsToDrop.length === 0) {
      return { ended: true };
    }

    logParticipantDebug(
      `participants selected for drop attempt ${attempt}`,
      participantsToDrop
    );

    for (const participant of participantsToDrop) {
      const participantId = getParticipantId(participant);

      if (participantId) {
        await dropParticipant(
          accessToken,
          config.baseUrl,
          config.controlExtension,
          participantId
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const { participants: refreshedParticipants } =
      await getCallControlState();

    currentParticipants = refreshedParticipants;
    logParticipantDebug(
      `participants after drop attempt ${attempt}`,
      currentParticipants
    );
  }

  const remainingParticipants = getRelevantActiveParticipants(
    currentParticipants,
    config.controlExtension,
    destination
  );

  if (remainingParticipants.length > 0) {
    console.warn(
      "[3cx] Call still has active participants after drop",
      remainingParticipants.map(getParticipantDebugSnapshot)
    );

    throw new ThreeCxPhoneProviderError(
      "3CX call still has active participants after drop."
    );
  }

  return { ended: true };
}
