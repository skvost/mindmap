# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mindmap — a visual mind-mapping application.

## Tech Stack

- **Frontend:** React + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- **Task tracking:** Beads (`bd` CLI)

## Agent Workflow

This project uses three specialized agent personas, invoked as slash commands:

| Command | Role | Does | Doesn't |
|---------|------|------|---------|
| `/po` | Product Owner | Clarifies requirements, creates beads issues, sets priorities & dependencies | Write code |
| `/dev` | Developer | Picks up issues, writes code, follows session close protocol | Make product decisions |
| `/arch` | Architect | Designs data models, reviews feasibility, assesses impact | Write implementation code |

**Typical flow:** `/po` to define work → `/arch` to validate design → `/dev` to implement.

## Coding Standards

- TypeScript strict mode — no `any` unless absolutely necessary
- Functional React components with hooks
- Tailwind for all styling — no CSS files
- shadcn/ui as the UI component layer
- Supabase client for all backend operations
- Small, focused commits with clear messages
- No dead code, no commented-out code

## Task Tracking

All task tracking uses Beads (`bd` CLI). See `.beads/` for project issues.

- **Never** use TodoWrite, TaskCreate, or markdown files for task tracking
- Every piece of work should have a beads issue before code is written
- Follow the session close protocol before finishing any session
