package com.xiaohang.jiaiagent.agent.multiagent;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Manages the lifecycle of all {@link AgentProfile} instances in the system.
 *
 * <p>Profiles are registered at startup (or dynamically) and can be retrieved
 * by name, queried by capability tag, or matched against a task description.
 *
 * <p>This registry is consulted by the {@link SupervisorAgent} when performing
 * agent selection and routing.
 *
 * <h2>Usage</h2>
 * <pre>
 * // Register a profile
 * profileRegistry.register(researcherProfile);
 *
 * // Find agent by name
 * AgentProfile profile = profileRegistry.getByName("researcher");
 *
 * // Find all agents capable of "code" tasks
 * List&lt;AgentProfile&gt; coders = profileRegistry.findByCapability("code");
 *
 * // Match a task to the best agent
 * AgentProfile best = profileRegistry.matchBestAgent("Write a Python script to analyze CSV data");
 * </pre>
 */
@Component
@Slf4j
public class AgentProfileRegistry {

    private final Map<String, AgentProfile> profiles = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        registerDefaults();
        log.info("AgentProfileRegistry initialised with {} default profiles", profiles.size());
    }

    /**
     * Registers (or replaces) a profile.
     */
    public void register(AgentProfile profile) {
        if (profile == null || profile.getName() == null) {
            throw new IllegalArgumentException("Profile and profile name must not be null");
        }
        profiles.put(profile.getName(), profile);
        log.info("Profile registered: name={}, displayName={}, capabilities={}",
                profile.getName(), profile.getDisplayName(), profile.getCapabilitiesSummary());
    }

    /**
     * Unregisters a profile by name.
     */
    public AgentProfile unregister(String name) {
        return profiles.remove(name);
    }

    /**
     * Returns a profile by name, or null if not found.
     */
    public AgentProfile getByName(String name) {
        return profiles.get(name);
    }

    /**
     * Returns all registered profiles.
     */
    public Collection<AgentProfile> getAll() {
        return List.copyOf(profiles.values());
    }

    /**
     * Returns all active (non-disabled) profiles.
     */
    public List<AgentProfile> getActive() {
        return profiles.values().stream()
                .filter(AgentProfile::isActive)
                .collect(Collectors.toList());
    }

    /**
     * Finds profiles whose capability keywords match the given task text.
     * Matching is case-insensitive substring matching.
     *
     * @param taskText the task description
     * @return profiles whose capabilities overlap with the task (sorted by priority desc)
     */
    public List<AgentProfile> findByTask(String taskText) {
        return profiles.values().stream()
                .filter(AgentProfile::isActive)
                .filter(p -> p.matchesTask(taskText))
                .sorted(Comparator.comparingInt(AgentProfile::getPriority).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Finds profiles that have the given capability keyword.
     *
     * @param capability a capability keyword (e.g. "search", "code")
     * @return profiles that declare this capability
     */
    public List<AgentProfile> findByCapability(String capability) {
        return profiles.values().stream()
                .filter(AgentProfile::isActive)
                .filter(p -> p.getCapabilities() != null &&
                        p.getCapabilities().stream()
                                .anyMatch(c -> c.equalsIgnoreCase(capability)))
                .sorted(Comparator.comparingInt(AgentProfile::getPriority).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Finds profiles that have the given tag.
     */
    public List<AgentProfile> findByTag(String tag) {
        return profiles.values().stream()
                .filter(AgentProfile::isActive)
                .filter(p -> p.getTags() != null &&
                        p.getTags().stream()
                                .anyMatch(t -> t.equalsIgnoreCase(tag)))
                .sorted(Comparator.comparingInt(AgentProfile::getPriority).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Selects the best-matching active agent profile for the given task.
     * Strategy:
     * <ol>
     *   <li>Exact name match (if task text equals a profile name)</li>
     *   <li>Capability substring match, highest priority wins</li>
     *   <li>Fallback to "supervisor" if no match</li>
     * </ol>
     *
     * @param taskText the task description
     * @return the best-matching profile, never null
     */
    public AgentProfile matchBestAgent(String taskText) {
        if (taskText == null || taskText.isBlank()) {
            return profiles.get("supervisor");
        }

        // Direct name match
        String lower = taskText.trim().toLowerCase();
        for (AgentProfile p : profiles.values()) {
            if (p.isActive() && p.getName().equalsIgnoreCase(lower)) {
                return p;
            }
        }

        // Capability match
        List<AgentProfile> matches = findByTask(taskText);
        if (!matches.isEmpty()) {
            return matches.get(0);
        }

        // Fallback
        return profiles.getOrDefault("supervisor",
                profiles.values().stream()
                        .filter(AgentProfile::isActive)
                        .findFirst()
                        .orElse(null));
    }

    /**
     * Returns the number of registered profiles.
     */
    public int size() {
        return profiles.size();
    }

    /**
     * Checks whether a profile exists for the given name.
     */
    public boolean exists(String name) {
        return profiles.containsKey(name);
    }

    /**
     * Deactivates a profile so it stops receiving tasks.
     */
    public void deactivate(String name) {
        AgentProfile p = profiles.get(name);
        if (p != null) {
            p.setActive(false);
            log.info("Profile deactivated: {}", name);
        }
    }

    /**
     * Reactivates a previously deactivated profile.
     */
    public void activate(String name) {
        AgentProfile p = profiles.get(name);
        if (p != null) {
            p.setActive(true);
            log.info("Profile activated: {}", name);
        }
    }

    /**
     * Registers the default profiles for the standard sub-agents.
     */
    private void registerDefaults() {
        register(AgentProfile.builder()
                .name("supervisor")
                .displayName("Supervisor Agent")
                .description("Orchestrates task routing to sub-agents, aggregates results, handles errors.")
                .capabilities("orchestrate", "route", "coordinate", "aggregate", "supervise", "manage")
                .priority(10)
                .active(true)
                .tags("orchestration")
                .build());

        register(AgentProfile.builder()
                .name("researcher")
                .displayName("Research Specialist")
                .description("Web search, page scraping, fact-checking, and information gathering.")
                .capabilities("search", "research", "scrape", "analyze", "find", "lookup", "investigate")
                .toolWhitelist(Set.of("searchWeb", "scrapeWebPage", "searchImage"))
                .maxSteps(15)
                .timeoutSeconds(180)
                .priority(7)
                .active(true)
                .tags("web", "research", "information")
                .build());

        register(AgentProfile.builder()
                .name("coder")
                .displayName("Code Generation Specialist")
                .description("Writes, reads, and edits code files; executes terminal commands.")
                .capabilities("code", "program", "script", "write", "edit", "develop", "implement", "build", "execute")
                .toolWhitelist(Set.of("readFile", "writeFile", "executeTerminalCommand"))
                .maxSteps(20)
                .timeoutSeconds(300)
                .priority(7)
                .active(true)
                .tags("code", "development")
                .build());
    }
}
