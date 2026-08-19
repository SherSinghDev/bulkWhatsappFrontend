import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const SharedStyles = StyleSheet.create({
  // Glass card
  glassCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },

  // Stat card
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Buttons
  btnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  btnPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  btnSecondary: {
    backgroundColor: Colors.bgHover,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  btnSecondaryText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: 14,
  },

  btnDanger: {
    backgroundColor: Colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  btnDangerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Input field
  inputField: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgDark,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  inputFieldFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    color: Colors.textSecondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // Badge
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Page container
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  pageContent: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Data table row
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  tableCellText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Sidebar link (for drawer)
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  sidebarLinkActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  sidebarLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sidebarLinkTextActive: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
