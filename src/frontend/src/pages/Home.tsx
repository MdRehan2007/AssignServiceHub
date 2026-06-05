import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCurrentQueue,
  useGetQueueStats,
  useGetUserRole,
  useListCounters,
} from "@/hooks/useQueue";
import type { ServiceCounter, TokenStatus } from "@/types/queue";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  MonitorPlay,
  Plus,
  RefreshCw,
  Ticket,
  Users,
  Zap,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Plus,
    title: "Join Queue",
    desc: "Generate your digital token instantly — from any device, no physical line required.",
  },
  {
    step: 2,
    icon: Clock,
    title: "Track Position",
    desc: "Real-time updates show your exact queue position and estimated wait time.",
  },
  {
    step: 3,
    icon: CheckCircle2,
    title: "Get Served",
    desc: "Head to your assigned counter when your token is called — seamless service.",
  },
];

const ROLE_LABEL: Record<string, string> = {
  Customer: "Customer",
  ServiceAgent: "Service Agent",
  Administrator: "Administrator",
};

const ROLE_BADGE_CLASS: Record<string, string> = {
  Customer:
    "bg-[oklch(var(--status-serving)_/_0.15)] text-[oklch(var(--status-serving))] border border-[oklch(var(--status-serving)_/_0.3)]",
  ServiceAgent:
    "bg-[oklch(var(--status-called)_/_0.15)] text-[oklch(var(--status-called))] border border-[oklch(var(--status-called)_/_0.3)]",
  Administrator:
    "bg-[oklch(var(--status-completed)_/_0.15)] text-[oklch(var(--status-completed))] border border-[oklch(var(--status-completed)_/_0.3)]",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function CounterCard({
  counter,
  servingToken,
}: { counter: ServiceCounter; servingToken?: number }) {
  const isActive = counter.status === "Active";
  const isIdle = counter.status === "Idle";

  return (
    <div
      className="surface-elevated rounded-xl p-4 flex items-center justify-between gap-3"
      data-ocid={`home.counter_card.${counter.counterId}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isActive
              ? "bg-[oklch(var(--status-completed))] animate-pulse"
              : isIdle
                ? "bg-[oklch(var(--status-called))]"
                : "bg-[oklch(var(--status-waiting))]"
          }`}
        />
        <span className="font-display font-semibold text-sm text-foreground truncate">
          {counter.counterName}
        </span>
      </div>
      <div className="text-right shrink-0">
        {isActive && servingToken != null ? (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Now Serving
            </p>
            <p className="font-display font-bold text-lg text-primary leading-tight">
              #{String(servingToken).padStart(4, "0")}
            </p>
          </div>
        ) : (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-md ${
              isIdle
                ? "bg-[oklch(var(--status-called)_/_0.15)] text-[oklch(var(--status-called))]"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {counter.status}
          </span>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  ocid,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  ocid: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="surface-elevated rounded-xl p-5 flex items-center gap-4"
      data-ocid={ocid}
    >
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-2xl text-foreground leading-tight">
          {value}
        </p>
        <p className="text-label mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

function QueueDepthBar({
  tokensByStatus,
}: { tokensByStatus: Record<string, number> }) {
  const total = Object.values(tokensByStatus).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const statuses: Array<{ key: string; status: TokenStatus; color: string }> = [
    {
      key: "waiting",
      status: "Waiting",
      color: "bg-[oklch(var(--status-waiting))]",
    },
    {
      key: "called",
      status: "Called",
      color: "bg-[oklch(var(--status-called))]",
    },
    {
      key: "serving",
      status: "Serving",
      color: "bg-[oklch(var(--status-serving))]",
    },
    {
      key: "completed",
      status: "Completed",
      color: "bg-[oklch(var(--status-completed))]",
    },
  ];

  return (
    <div className="space-y-2.5">
      <p className="text-label">Queue Depth</p>
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {statuses.map(({ key, color }) => {
          const count = tokensByStatus[key] ?? 0;
          const pct = Math.round((count / total) * 100);
          return pct > 0 ? (
            <div
              key={key}
              className={`${color} h-full`}
              style={{ width: `${pct}%` }}
            />
          ) : null;
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {statuses.map(({ key, status }) => {
          const count = tokensByStatus[key] ?? 0;
          return (
            <div
              key={key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <StatusBadge
                status={status}
                className="py-0 px-1.5 text-[10px]"
              />
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function HomePage() {
  const { data: stats, isLoading: statsLoading } = useGetQueueStats();
  const { data: counters, isLoading: countersLoading } = useListCounters();
  const { data: queue } = useCurrentQueue();
  const { data: role } = useGetUserRole();

  // Build a map: counterId → tokenNumber currently being served
  const servingByCounter: Record<string, number> = {};
  if (queue) {
    for (const token of queue) {
      if (
        (token.status === "Serving" || token.status === "Called") &&
        token.counterId
      ) {
        servingByCounter[token.counterId] = token.tokenNumber;
      }
    }
  }

  const activeCounters = (counters ?? []).filter((c) => c.status === "Active");
  const isLoggedIn = !!role;

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="bg-card border-b border-border"
        data-ocid="home.hero_section"
      >
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: brand + copy */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1.5 border-primary/30 text-primary bg-primary/5 px-3 py-1 text-sm font-medium"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Smart Queue Management
                </Badge>
                {isLoggedIn && role && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE_CLASS[role]}`}
                    data-ocid="home.role_badge"
                  >
                    <Users className="w-3 h-3" />
                    {ROLE_LABEL[role]}
                  </span>
                )}
              </div>

              <div>
                <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-[1.05] tracking-tight">
                  Queue<span className="text-primary">Flow</span>
                </h1>
                <p className="mt-3 font-display text-xl md:text-2xl text-muted-foreground font-medium leading-snug">
                  Smart Queue Management for Modern Businesses
                </p>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                Eliminate waiting lines with digital tokens, real-time tracking,
                and intelligent counter assignment. Customers join from anywhere
                — service agents stay in control.
              </p>

              <ul className="space-y-2">
                {[
                  "Join the queue remotely — no physical presence needed",
                  "Live position updates with estimated wait time",
                  "Multi-counter support for high-volume businesses",
                  "Admin analytics and service performance reports",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>

              {/* Quick Actions — role-based */}
              <QuickActions role={role} isLoggedIn={isLoggedIn} />
            </div>

            {/* Right: live stats panel */}
            <div
              className="surface-elevated rounded-2xl p-6 space-y-6"
              data-ocid="home.live_stats_panel"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg text-foreground">
                  Live Stats
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Updating every 5s
                </span>
              </div>

              {statsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Waiting Now",
                      value: stats?.totalWaiting ?? "—",
                      ocid: "home.stat.waiting",
                    },
                    {
                      label: "Served Today",
                      value: stats?.totalServed ?? "—",
                      ocid: "home.stat.served",
                    },
                    {
                      label: "Avg Wait",
                      value: stats
                        ? `${Math.round(stats.averageWaitTimeSecs / 60)}m`
                        : "—",
                      ocid: "home.stat.avg_wait",
                    },
                    {
                      label: "Active Counters",
                      value: activeCounters.length,
                      ocid: "home.stat.active_counters",
                    },
                  ].map(({ label, value, ocid }) => (
                    <div
                      key={label}
                      className="bg-muted/40 rounded-xl p-4 text-center"
                      data-ocid={ocid}
                    >
                      <p className="font-display font-bold text-2xl text-primary">
                        {value}
                      </p>
                      <p className="text-label mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {stats && <QueueDepthBar tokensByStatus={stats.tokensByStatus} />}

              <Link
                to="/customer/place-order"
                data-ocid="home.hero_join_button"
              >
                <Button className="w-full gap-2" size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  Get Your Token Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <section
        className="bg-muted/30 border-b border-border"
        data-ocid="home.stats_row"
      >
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statsLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))
            ) : (
              <>
                <StatTile
                  label="Total Customers Served Today"
                  value={stats?.totalServed ?? 0}
                  ocid="home.stats_row.served"
                  icon={Users}
                />
                <StatTile
                  label="Average Wait Time"
                  value={
                    stats
                      ? `${Math.round(stats.averageWaitTimeSecs / 60)} min`
                      : "—"
                  }
                  ocid="home.stats_row.avg_wait"
                  icon={Clock}
                />
                <StatTile
                  label="Active Counters"
                  value={activeCounters.length}
                  ocid="home.stats_row.active_counters"
                  icon={MonitorPlay}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Live Queue Status Board ────────────────────────────────────────── */}
      <section
        className="bg-background border-b border-border"
        data-ocid="home.queue_board_section"
      >
        <div className="container mx-auto px-4 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-primary border-primary/30 bg-primary/5"
                >
                  Live Board
                </Badge>
                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                  <RefreshCw
                    className="w-3 h-3 animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                  Auto-refreshing
                </span>
              </div>
              <h2 className="text-headline">Live Queue Status Board</h2>
              <p className="text-sm text-muted-foreground">
                All active service counters — showing current token being served
              </p>
            </div>
            <div
              className="surface-elevated rounded-xl px-5 py-3 text-center"
              data-ocid="home.queue_depth_summary"
            >
              <p className="font-display font-bold text-3xl text-primary">
                {stats?.totalWaiting ?? "—"}
              </p>
              <p className="text-label mt-0.5">In Queue</p>
            </div>
          </div>

          {countersLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (counters ?? []).length === 0 ? (
            <div
              className="surface-elevated rounded-xl p-12 text-center space-y-3"
              data-ocid="home.queue_board.empty_state"
            >
              <MonitorPlay className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">
                No counters configured yet.
              </p>
            </div>
          ) : (
            <div
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="home.counter_list"
            >
              {(counters ?? []).map((counter, idx) => (
                <div
                  key={counter.counterId}
                  data-ocid={`home.counter_list.item.${idx + 1}`}
                >
                  <CounterCard
                    counter={counter}
                    servingToken={servingByCounter[counter.counterId]}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Active counters call-out */}
          {activeCounters.length > 0 && (
            <Card
              className="surface-elevated mt-6 border-primary/20 bg-primary/5"
              data-ocid="home.active_counters_summary"
            >
              <CardContent className="p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-[oklch(var(--status-completed))] animate-pulse" />
                  {activeCounters.length} counter
                  {activeCounters.length !== 1 ? "s" : ""} currently active
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCounters.map((c) => (
                    <span
                      key={c.counterId}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary/10 text-primary"
                    >
                      {c.counterName}
                      {servingByCounter[c.counterId] != null
                        ? ` → #${String(servingByCounter[c.counterId]).padStart(4, "0")}`
                        : " — Idle"}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section
        className="bg-muted/30 border-b border-border"
        data-ocid="home.how_it_works_section"
      >
        <div className="container mx-auto px-4 py-14">
          <div className="text-center mb-10 space-y-2">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 bg-primary/5"
            >
              3 Simple Steps
            </Badge>
            <h2 className="text-headline">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              From joining to being served — the entire experience is digital,
              transparent, and fast.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-border z-0" />
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.step}
                  className="surface-elevated relative z-10"
                  data-ocid={`home.step.${step.step}`}
                >
                  <CardHeader className="pb-0 pt-6 items-center text-center">
                    <div className="relative inline-block">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {step.step}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6 text-center space-y-2">
                    <h3 className="font-display font-semibold text-lg text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="bg-primary" data-ocid="home.cta_banner">
        <div className="container mx-auto px-4 py-14 text-center space-y-5">
          <Ticket className="w-9 h-9 text-primary-foreground mx-auto opacity-80" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
            Ready to eliminate the wait?
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto">
            Join digitally, track your position in real time, and get called
            when it's your turn.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link to="/customer/dashboard" data-ocid="home.banner_cta_button">
              <Button
                size="lg"
                className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
              >
                <Plus className="w-4 h-4" />
                Join the Queue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/admin/analytics" data-ocid="home.banner_agent_link">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Agent Console
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Quick Actions (role-based) ────────────────────────────────────────────────

function QuickActions({
  role,
  isLoggedIn,
}: { role: string | undefined; isLoggedIn: boolean }) {
  if (!isLoggedIn || !role) {
    return (
      <div className="flex flex-wrap gap-3 pt-1" data-ocid="home.quick_actions">
        <Link
          to="/customer/dashboard"
          data-ocid="home.quick_actions.join_button"
        >
          <Button size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            Customer Portal
          </Button>
        </Link>
        <Link to="/join-team" data-ocid="home.quick_actions.login_button">
          <Button size="lg" variant="outline" className="gap-2">
            Join Team
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 pt-1" data-ocid="home.quick_actions">
      <Link
        to="/customer/dashboard"
        data-ocid="home.quick_actions.customer_button"
      >
        <Button size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Customer Portal
        </Button>
      </Link>
      <Link to="/admin/analytics" data-ocid="home.quick_actions.admin_button">
        <Button size="lg" variant="outline" className="gap-2">
          <LayoutDashboard className="w-4 h-4" />
          Admin Dashboard
        </Button>
      </Link>
    </div>
  );
}
