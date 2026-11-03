/**
 * Demo Clock Controller
 * Accelerates mock clock progression for live hackathon video recording
 */

const speed = Number(process.env.DEMO_CLOCK_SPEED) || 60;
console.log(`[Stake Demo Clock] Accelerated mode active: 1 real second = ${speed} simulated seconds.`);
console.log(`[Stake Demo Clock] 48-hour sprint duration completes in ${(48 * 60) / speed} minutes.`);

