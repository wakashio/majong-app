import { API_BASE_URL } from "../config/api";
import type {
  CreateRoundRequest,
  UpdateRoundRequest,
  CreateNakiRequest,
  CreateRiichiRequest,
  CreateRoundActionRequest,
  EndRoundRequest,
  RoundsListResponse,
  RoundResponse,
  NakiResponse,
  RiichiResponse,
  RoundActionResponse,
  ErrorResponse,
  CalculateScoreRequest,
  CalculateScoreResponse,
  CalculateNextSettingsRequest,
  CalculateNextSettingsResponse,
} from "../types/round";

export async function getRounds(
  hanchanId: string
): Promise<RoundsListResponse | ErrorResponse> {
  try {
    const url = new URL(
      `${API_BASE_URL}/api/hanchans/${hanchanId}/rounds`
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RoundsListResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getRound(
  id: string
): Promise<RoundResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rounds/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RoundResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createRound(
  hanchanId: string,
  request: CreateRoundRequest
): Promise<RoundResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/hanchans/${hanchanId}/rounds`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RoundResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function updateRound(
  id: string,
  request: UpdateRoundRequest
): Promise<RoundResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rounds/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RoundResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function deleteRound(
  id: string
): Promise<void | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rounds/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    return;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createNaki(
  roundId: string,
  request: CreateNakiRequest
): Promise<NakiResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/nakis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as NakiResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createRoundAction(
  roundId: string,
  request: CreateRoundActionRequest
): Promise<RoundActionResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RoundActionResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function deleteRoundAction(
  roundId: string,
  actionId: string
): Promise<void | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/actions/${actionId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    return;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createRiichi(
  roundId: string,
  request: CreateRiichiRequest
): Promise<RiichiResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/riichis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RiichiResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function endRound(
  roundId: string,
  request: EndRoundRequest
): Promise<RoundResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/end`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const data = await response.json();
    return data as RoundResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function calculateScore(
  roundId: string,
  data: CalculateScoreRequest
): Promise<CalculateScoreResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/calculate-score`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const result = await response.json();
    return result as CalculateScoreResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function calculateNextSettings(
  roundId: string,
  data: CalculateNextSettingsRequest
): Promise<CalculateNextSettingsResponse | ErrorResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rounds/${roundId}/calculate-next-settings`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: {
          code: "HTTP_ERROR",
          message: `HTTP error! status: ${response.status}`,
        },
      }));
      return errorData as ErrorResponse;
    }

    const result = await response.json();
    return result as CalculateNextSettingsResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

