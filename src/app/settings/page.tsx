import React from "react";

/**
 * Settings page provides controls for connecting external services and
 * configuring preferences such as email time. In a real app you would
 * integrate Supabase Auth to identify the user, then call the Strava
 * OAuth connect endpoint with a state parameter equal to their user ID.
 */
export default function SettingsPage() {
  const connectUrl = "/api/strava/connect";
  return (
    <section>
      <h1 style={{ marginBottom: "1rem" }}>Settings</h1>
      <p>
        Use this page to connect your Strava account and choose your daily email
        notification time. Connecting your Strava account allows us to sync your
        activities and automatically mark workouts as complete.
      </p>
      <p style={{ marginTop: "1rem" }}>
        <a href={connectUrl} style={{ padding: "0.5rem 1rem", background: "#0070f3", color: "white", borderRadius: 4 }}>Connect Strava</a>
      </p>
      <p style={{ marginTop: "2rem" }}>
        Email notifications are dispatched based on your saved time zone and
        preferred send time. You can adjust these settings through your
        profile (to be implemented).
      </p>
    </section>
  );
}
