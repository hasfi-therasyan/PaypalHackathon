"""Bayesian stake recommender. Beta-Binomial posterior over a user's sprint history."""
from fastapi import FastAPI
from pydantic import BaseModel
from scipy.stats import beta as beta_dist

app = FastAPI(title="Stake Model Service")

PRIOR_ALPHA = 4.5
PRIOR_BETA = 1.5
STAKE_GRID_CENTS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]


class PredictRequest(BaseModel):
    successes: int = 6
    failures: int = 1
    comfort_budget_cents: int = 1000


class StakePoint(BaseModel):
    stake_cents: int
    p_success: float
    expected_loss_cents: float
    under_budget: bool


class PredictResponse(BaseModel):
    posterior_mean: float
    ci80_lower: float
    ci80_upper: float
    recommended_stake_cents: int
    stake_curve: list[StakePoint]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    post_alpha = PRIOR_ALPHA + req.successes
    post_beta = PRIOR_BETA + req.failures
    posterior_mean = post_alpha / (post_alpha + post_beta)
    ci80_lower = beta_dist.ppf(0.10, post_alpha, post_beta)
    ci80_upper = beta_dist.ppf(0.90, post_alpha, post_beta)

    curve = []
    for stake_cents in STAKE_GRID_CENTS:
        p_success = min(0.95, 0.65 + 0.005 * (stake_cents / 100))
        expected_loss = (1 - p_success) * stake_cents
        curve.append(
            StakePoint(
                stake_cents=stake_cents,
                p_success=round(p_success, 4),
                expected_loss_cents=round(expected_loss, 2),
                under_budget=expected_loss <= req.comfort_budget_cents,
            )
        )

    under_budget = [c for c in curve if c.under_budget]
    recommended = under_budget[-1] if under_budget else curve[0]

    return PredictResponse(
        posterior_mean=round(posterior_mean, 4),
        ci80_lower=round(float(ci80_lower), 4),
        ci80_upper=round(float(ci80_upper), 4),
        recommended_stake_cents=recommended.stake_cents,
        stake_curve=curve,
    )


def _demo():
    r = predict(PredictRequest())
    assert 0 < r.posterior_mean < 1
    assert r.ci80_lower < r.posterior_mean < r.ci80_upper
    assert r.recommended_stake_cents in STAKE_GRID_CENTS
    print("ok:", r.posterior_mean, r.recommended_stake_cents)


if __name__ == "__main__":
    _demo()
