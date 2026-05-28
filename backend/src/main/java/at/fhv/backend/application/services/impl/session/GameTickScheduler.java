package at.fhv.backend.application.services.impl.session;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Responsible only for scheduling, locking, and rate-limiting.
 * All game logic lives in GameTickProcessor, which is called via
 * Spring proxy so that @Transactional works correctly.
 */
@Service
public class GameTickScheduler {

    private final GameTickProcessor tickProcessor;

    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);
    private final Map<UUID, ScheduledFuture<?>> runningTasks = new ConcurrentHashMap<>();
    private final Map<UUID, Long> lastTickProcessedAtMs = new ConcurrentHashMap<>();
    private final Map<UUID, ReentrantLock> tickLocks = new ConcurrentHashMap<>();

    public GameTickScheduler(GameTickProcessor tickProcessor) {
        this.tickProcessor = tickProcessor;
    }

    public void startForSession(UUID sessionId, int tickRateSeconds) {
        runningTasks.computeIfAbsent(sessionId, ignored ->
                executor.scheduleAtFixedRate(
                        () -> processTick(sessionId),
                        tickRateSeconds,
                        tickRateSeconds,
                        TimeUnit.SECONDS
                )
        );
    }

    public void stopForSession(UUID sessionId) {
        ScheduledFuture<?> task = runningTasks.remove(sessionId);
        if (task != null) task.cancel(false);
        lastTickProcessedAtMs.remove(sessionId);
        tickLocks.remove(sessionId);
    }

    private void processTick(UUID sessionId) {
        ReentrantLock lock = tickLocks.computeIfAbsent(sessionId, ignored -> new ReentrantLock());
        if (!lock.tryLock()) {
            return;
        }

        try {
            long now = System.currentTimeMillis();
            long lastAt = lastTickProcessedAtMs.getOrDefault(sessionId, 0L);

            // Call the processor via Spring proxy → @Transactional works
            GameTickProcessor.TickResult result = tickProcessor.executeTick(sessionId, lastAt, now);

            switch (result) {
                case OK -> lastTickProcessedAtMs.put(sessionId, now);
                case SESSION_NOT_FOUND, SESSION_FINISHED -> stopForSession(sessionId);
                case RATE_LIMITED -> { /* skip this tick */ }
            }
        } catch (Exception e) {
            System.err.println("Tick error for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
        } finally {
            lock.unlock();
        }
    }

    public void triggerImmediateBroadcast(UUID sessionId) {
        try {
            tickProcessor.triggerImmediateBroadcast(sessionId);
        } catch (Exception e) {
            System.err.println("Immediate broadcast error: " + e.getMessage());
        }
    }

    @PreDestroy
    public void shutdown() {
        for (ScheduledFuture<?> task : runningTasks.values()) {
            task.cancel(false);
        }
        runningTasks.clear();
        lastTickProcessedAtMs.clear();
        tickLocks.clear();
        executor.shutdownNow();
    }
}