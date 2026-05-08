/**
 * English dictionary.
 * Mirror of fr.ts — must keep the same shape (TypeScript enforces structural equality).
 * Missing keys silently fall back to French at runtime via `getDict()`.
 */

import type { Dictionary } from './fr'

export const en: Dictionary = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading…',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    confirm: 'Confirm',
    close: 'Close',
    error: 'Error',
    success: 'Success',
  },

  language: {
    label: 'Language',
    description: 'Choose the interface language.',
    fr: 'Français',
    en: 'English',
    saved: 'Language saved',
  },

  header: {
    nav: {
      dashboard: 'Dashboard',
      challenges: 'Challenges',
      leagues: 'Leagues',
    },
    menu: {
      publicProfile: 'Public profile',
      editProfile: 'Edit profile',
      settings: 'Settings',
      notifications: 'Notifications',
      appearance: 'Appearance',
      signOut: 'Sign out',
      planSuffix: 'plan',
    },
  },

  dashboard: {
    keepGoing: 'Keep going, {name}. Tomorrow\'s another XP day. 🌟',
    profileHeader: {
      editProfile: 'Edit profile →',
      jobTitles: {
        entry: 'Entry Level',
        junior: 'Junior',
        senior: 'Senior',
        ux_ui: 'UX/UI Designer',
        graphic: 'Graphic Designer',
        designer: 'Designer',
      },
    },
    statCards: {
      league: 'LEAGUE',
      totalXp: 'TOTAL XP',
      streak: 'STREAK',
      challenges: 'CHALLENGES',
      tierOf: 'Tier {n} of 8',
      xpToday: '+{n} XP today',
      keepGoing: 'Keep going!',
      personalBest: 'Personal best 🏆',
      best: 'Best: {n}d',
      thisWeek: '+{n} this week',
      completeFirst: 'Complete your first!',
    },
    leagueSection: {
      yourLeague: 'YOUR LEAGUE',
      leagueSuffix: 'League',
      xpProgress: '⚡ XP progress',
      challengesProgress: '🎯 Challenges progress',
      rank: 'Rank #{rank} of {total}',
      pushToTop: 'Push to top 10 🔥',
    },
    countdownCard: {
      leagueEndsSoon: '⏰ League ends soon',
      highStakes: '🔺 High stakes',
      dontLose: 'Don\'t lose your spot.',
      stayActive: 'Stay active to remain in {league}. Top 20 stay. Others drop to {next}.',
      days: 'DAYS',
      hours: 'HOURS',
      min: 'MIN',
      sec: 'SEC',
      completeChallenge: '⚡ Complete a Challenge',
    },
    whatToDoNow: {
      title: '🎯 What to do now',
      subtitle: 'Actions ranked by XP to gain',
      complete: 'Complete "{title}"',
      completeAny: 'Complete a challenge',
      bestAction: 'Best action to level up',
      commentSubmissions: 'Comment 3 submissions',
      commentDetail: '5 min · boost your streak',
      inviteFriend: 'Invite a friend',
      shareProfile: 'Share your profile',
      shareDetail: 'Instant · share your link',
      daysType: '{days} days · {type}',
      xp: '+{n} XP',
    },
    contextualLeaderboard: {
      yourRank: 'Your rank in {league}',
      countLine: '#{rank} of {total} designers',
      seeAll: 'See all →',
      onlyXpToTop10: '🔥 Only <strong>{n} XP</strong> away from the top 10!',
      you: 'You',
      xpSuffix: 'XP',
    },
  },

  settings: {
    title: 'Settings',
    sections: {
      language: 'Language',
      account: 'Account',
      billing: 'Billing',
      notifications: 'Notifications',
    },
  },
}
