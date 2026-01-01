import { API_BASE_URL } from "../config/api";
import type {
  CreatePlayerRequest,
  UpdatePlayerRequest,
  BulkCreatePlayerRequest,
  PlayersListResponse,
  PlayerResponse,
  BulkCreatePlayerResponse,
  ErrorResponse,
  PlayerStatisticsResponse,
  PlayerHistoryResponse,
} from "../types/player";

export async function getPlayers(): Promise<PlayersListResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players`, {
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
    return data as PlayersListResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getPlayer(id: string): Promise<PlayerResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/${id}`, {
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
    return data as PlayerResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createPlayer(request: CreatePlayerRequest): Promise<PlayerResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players`, {
      method: "POST",
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
    return data as PlayerResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function bulkCreatePlayer(request: BulkCreatePlayerRequest): Promise<BulkCreatePlayerResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/bulk`, {
      method: "POST",
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
    return data as BulkCreatePlayerResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function updatePlayer(id: string, request: UpdatePlayerRequest): Promise<PlayerResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/${id}`, {
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
    return data as PlayerResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function deletePlayer(id: string): Promise<void | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/${id}`, {
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

export async function getPlayerStatistics(playerId: string): Promise<PlayerStatisticsResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/statistics`, {
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
    return data as PlayerStatisticsResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getPlayerHistory(
  playerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<PlayerHistoryResponse | ErrorResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/players/${playerId}/history`);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("offset", offset.toString());

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
    return data as PlayerHistoryResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

