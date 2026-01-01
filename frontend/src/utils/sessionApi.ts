import { API_BASE_URL } from "../config/api";
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
  SessionsListResponse,
  SessionResponse,
  ErrorResponse,
  SessionStatisticsResponse,
  DeleteSessionResponse,
} from "../types/session";

export async function getSessions(
  limit: number = 50,
  offset: number = 0
): Promise<SessionsListResponse | ErrorResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/sessions`);
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
    return data as SessionsListResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getSession(id: string): Promise<SessionResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${id}`, {
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
    return data as SessionResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createSession(request: CreateSessionRequest): Promise<SessionResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
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
    return data as SessionResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function updateSession(
  id: string,
  request: UpdateSessionRequest
): Promise<SessionResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${id}`, {
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
    return data as SessionResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function deleteSession(id: string): Promise<DeleteSessionResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${id}`, {
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

    const data = await response.json();
    return data as DeleteSessionResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getSessionStatistics(
  sessionId: string
): Promise<SessionStatisticsResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/statistics`, {
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
    return data as SessionStatisticsResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

