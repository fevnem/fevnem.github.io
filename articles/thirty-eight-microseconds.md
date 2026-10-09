---
title: Thirty-eight microseconds
date: 2026-10-09
summary: The clocks in orbit run fast. Ignore that and your position drifts eleven kilometres a day.
tags: [gps, relativity, instruments]
minutes: 6
draft: false
---

A GPS satellite carries a clock that was tuned before launch. It does not run at the same rate as
the clock in your phone, and that is not a defect — it is arithmetic. Two effects pull in opposite
directions, and their sum is small enough to write down in one line.

## The two pulls

**Special relativity.** The satellite moves at about 3.9 km/s relative to the ground. Moving clocks
run *slow*, by

    Δt_special ≈ -7 μs per day

**General relativity.** The satellite sits at 26 560 km from the Earth's centre, where gravity is
weaker than at the surface. Clocks in weaker gravity run *fast*:

    Δt_general ≈ +45 μs per day

Add them and the satellite's clock gains roughly **38 microseconds a day**. Small — until you
multiply by the speed of light.

## What 38 μs buys

Light travels 299.792458 metres in a microsecond. Thirty-eight of them is the distance a signal
covers in that time:

    38 × 0.299792458 km ≈ 11.4 km per day

If the receiver treated the satellite clock as exact, every range measurement would be wrong by a
growing offset — about 11 km of position error accumulated each day, and it would be *gone* before
anyone could complain about it.

## Why this is not a worry in practice

Two reasons, and they are both worth internalising.

1. **The offset is designed in.** The nominal frequency is set below the natural one before launch,
   so that the orbiting clock *appears* to tick at the same rate as a clock on the ground. The
   correction is not applied by the receiver — it is baked into the hardware.
2. **And it is solved for anyway.** Your receiver treats its own clock error as an unknown and
   solves for it alongside latitude, longitude and height. That is the whole reason four satellites
   are needed rather than three: the fourth measurement buys the fourth unknown.

The second reason is the interesting one. It means GPS does not need a perfect clock anywhere — not
in orbit, not in your hand. It needs *enough measurements* to stop caring.

> The system is not accurate because its clocks are good. It is accurate because it does not need
> them to be.

## What I took from it

Relativity in a consumer device is usually told as a curiosity: *look, Einstein, in your pocket*.
The engineering lesson is duller and more useful. A 38 μs/day error is fatal only if it is
unmodelled; once it is a term in the equation rather than a fact about the world, it disappears into
the same solver that handles the cheap clock in your hand.

Make the error a variable, and it stops being a problem.

---

*Related: [Where You Are](https://github.com/fevnem/where-you-are) — an explorable explanation of
GPS built with hand-written WebGL2, where this chapter is one of nine.*
