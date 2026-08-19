import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import QuickSendScreen from '../screens/QuickSendScreen';
import ContactsScreen from '../screens/ContactsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import CampaignsScreen from '../screens/CampaignsScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UsersScreen from '../screens/UsersScreen';
import PlansScreen from '../screens/PlansScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import LoginScreen from '../screens/LoginScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const tenantNavItems = [
  { name: 'Dashboard', icon: 'home-outline' as const, label: 'Dashboard' },
  { name: 'QuickSend', icon: 'flash-outline' as const, label: 'Quick Send' },
  { name: 'Contacts', icon: 'people-outline' as const, label: 'Contacts' },
  { name: 'Templates', icon: 'document-text-outline' as const, label: 'Templates' },
  { name: 'Campaigns', icon: 'megaphone-outline' as const, label: 'Campaigns' },
  { name: 'Reports', icon: 'analytics-outline' as const, label: 'Reports' },
  { name: 'History', icon: 'time-outline' as const, label: 'History' },
  { name: 'Settings', icon: 'settings-outline' as const, label: 'WhatsApp & Settings' },
];

const superAdminNavItems = [
  { name: 'AdminDashboard', icon: 'stats-chart-outline' as const, label: 'Platform Overview' },
  { name: 'Users', icon: 'people-circle-outline' as const, label: 'Tenant Management' },
  { name: 'Plans', icon: 'pricetags-outline' as const, label: 'SaaS Plans' },
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const currentRoute = props.state.routes[props.state.index]?.name;
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <View style={styles.drawerContainer}>
      {/* Header / Logo */}
      <View style={styles.logoSection}>
        <LinearGradient colors={['#25D366', '#128C7E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoIcon}>
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.logoTitle}>WA Messenger</Text>
          <Text style={styles.logoSubtitle}>Bulk Messaging</Text>
        </View>
      </View>

      {/* Scrollable Nav Area */}
      <DrawerContentScrollView
        {...props}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Main Messaging Menu */}
        <Text style={styles.sectionHeader}>MESSAGING</Text>
        {tenantNavItems.map((item) => {
          const isActive = currentRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => props.navigation.navigate(item.name)}
              style={[styles.navItem, isActive && styles.navItemActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? (item.icon.replace('-outline', '') as any) : item.icon}
                size={19}
                color={isActive ? Colors.primaryLight : Colors.textSecondary}
              />
              <Text style={[styles.navItemText, isActive && styles.navItemTextActive]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>SUPER ADMIN</Text>
            {superAdminNavItems.map((item) => {
              const isActive = currentRoute === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => props.navigation.navigate(item.name)}
                  style={[styles.navItem, isActive && styles.navItemActiveAdmin]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isActive ? (item.icon.replace('-outline', '') as any) : item.icon}
                    size={19}
                    color={isActive ? '#c084fc' : Colors.textSecondary}
                  />
                  <Text style={[styles.navItemText, isActive && styles.navItemTextActiveAdmin]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </DrawerContentScrollView>

      {/* Footer / User Profile */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={styles.userMeta}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
            <View style={[styles.roleBadge, isSuperAdmin ? styles.roleBadgePrimary : styles.roleBadgeInfo]}>
              <Text style={styles.roleBadgeText}>
                {isSuperAdmin ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Tenant'}
              </Text>
            </View>
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DrawerNavigator() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bgCard, elevation: 0, shadowOpacity: 0 },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        drawerStyle: { width: 270, backgroundColor: Colors.bgCard },
        headerShadowVisible: false,
        drawerType: isDesktop ? 'permanent' : 'front',
        headerShown: !isDesktop,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="QuickSend" component={QuickSendScreen} options={{ title: 'Quick Send' }} />
      <Drawer.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Contacts' }} />
      <Drawer.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Templates' }} />
      <Drawer.Screen name="Campaigns" component={CampaignsScreen} options={{ title: 'Campaigns' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      <Drawer.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Drawer.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Platform Overview' }} />
      <Drawer.Screen name="Users" component={UsersScreen} options={{ title: 'Tenant Management' }} />
      <Drawer.Screen name="Plans" component={PlansScreen} options={{ title: 'SaaS Plans' }} />
    </Drawer.Navigator>
  );
}

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={DrawerNavigator} />
      <Stack.Screen
        name="CampaignDetail"
        component={CampaignDetailScreen}
        options={{
          headerShown: true,
          title: 'Campaign Details',
          headerStyle: { backgroundColor: Colors.bgCard },
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: Colors.bgCard,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logoSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    marginHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 3,
  },
  navItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  navItemActiveAdmin: {
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
  },
  navItemText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1,
  },
  navItemTextActive: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  navItemTextActiveAdmin: {
    color: '#c084fc',
    fontWeight: '600',
  },
  userSection: {
    padding: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  userInfo: {
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  userName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  roleBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleBadgePrimary: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  roleBadgeInfo: {
    backgroundColor: Colors.badgeInfo.bg,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
});
