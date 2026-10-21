export const json = <T>(data: T, status = 200) => Response.json(data, { status });

export const errorJson = (message: string, status: number) => json({ error: message }, status);
