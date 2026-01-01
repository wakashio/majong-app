import { API_BASE_URL } from "../config/api";
import type {
  CreateHanchanRequest,
  UpdateHanchanRequest,
  HanchansListResponse,
  HanchanResponse,
  ErrorResponse,
  HanchanStatus,
  HanchanStatisticsResponse,
  HanchanHistoryResponse,
} from "../types/hanchan";

export async function getHanchans(status?: HanchanStatus): Promise<HanchansListResponse | ErrorResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/hanchans`);
    if (status) {
      url.searchParams.append("status", status);
    }

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
    return data as HanchansListResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getHanchan(id: string): Promise<HanchanResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hanchans/${id}`, {
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
    return data as HanchanResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function createHanchan(request: CreateHanchanRequest): Promise<HanchanResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hanchans`, {
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
    return data as HanchanResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function updateHanchan(id: string, request: UpdateHanchanRequest): Promise<HanchanResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hanchans/${id}`, {
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
    return data as HanchanResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function deleteHanchan(id: string): Promise<void | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hanchans/${id}`, {
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

export async function getHanchanStatistics(hanchanId: string): Promise<HanchanStatisticsResponse | ErrorResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/hanchans/${hanchanId}/statistics`, {
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
    return data as HanchanStatisticsResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

export async function getHanchanHistory(
  hanchanId: string,
  limit: number = 50,
  offset: number = 0
): Promise<HanchanHistoryResponse | ErrorResponse> {
  try {
    const url = new URL(`${API_BASE_URL}/api/hanchans/${hanchanId}/history`);
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
    return data as HanchanHistoryResponse;
  } catch (error) {
    return {
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
    } as ErrorResponse;
  }
}

