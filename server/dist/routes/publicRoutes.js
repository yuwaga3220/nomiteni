export function registerPublicRoutes(app, deps) {
    app.get("/api/health", (_req, res) => res.json({ ok: true }));
    app.get("/api/public/state", async (_req, res) => {
        res.json(await deps.tournamentService.buildPublicState());
    });
    app.get("/api/settings", async (_req, res) => {
        res.json({ courtCount: await deps.tournamentService.getCourtCount() });
    });
}
