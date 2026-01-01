import request from "supertest";
import app from "../../src/app";

describe("GET /health", () => {
  it("ヘルスチェックエンドポイントが正常に動作する", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toHaveProperty("status");
    expect(response.body.status).toBe("ok");
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("麻雀記録アプリ API");
  });

  it("レスポンスがJSON形式である", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.headers["content-type"]).toMatch(/json/);
  });
});

