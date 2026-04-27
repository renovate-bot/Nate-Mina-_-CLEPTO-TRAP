import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Video } from 'expo-av';
import { Camera, AlertCircle, Clock, Settings, FolderOpen, PlayCircle, X } from 'lucide-react-native';

const STUB_EVENTS = [
  { id: '1', type: 'theft', desc: 'Item concealed in jacket pocket', conf: 0.92, time: '4/25/26, 12:45 PM', hasVideo: true },
  { id: '2', type: 'suspicious', desc: 'Lingering near high-value goods', conf: 0.76, time: '4/25/26, 11:20 AM', hasVideo: false },
];

export default function App() {
  const [activeFeeds, setActiveFeeds] = useState([
    { id: 'cam1', name: 'Front Entrance' }
  ]);

  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [dailyDigest, setDailyDigest] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const generateDigest = () => {
    setIsGeneratingDigest(true);
    // Simulate generation...
    setTimeout(() => {
        setDailyDigest("Daily Security Digest:\n\n- 2 Suspicious Activities detected around high-value items.\n- 1 Confirmed theft (concealment in jacket).\n\nRecommendation: Increase staff presence in aisles 4 and 5 during peak hours.");
        setIsGeneratingDigest(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Camera color="#60A5FA" size={24} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Clepto Trap</Text>
            <Text style={styles.headerSubtitle}>AI SECURITY</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Text style={styles.profileText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Main Feed Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeFeeds.length === 0 ? (
          <View style={styles.emptyState}>
             <Camera color="#3f3f46" size={48} />
             <Text style={styles.emptyStateTitle}>No Active Streams</Text>
             <Text style={styles.emptyStateSub}>Connect a camera below</Text>
          </View>
        ) : (
          <View style={styles.feedsList}>
            {activeFeeds.map(feed => (
              <View key={feed.id} style={styles.feedCard}>
                 {/* Placeholder for actual Video component */}
                 <View style={styles.videoPlaceholder}>
                    <Text style={styles.feedStatus}>REC</Text>
                    <Text style={styles.feedName}>{feed.name}</Text>
                    
                    <View style={styles.threatLayer}>
                       <Text style={styles.threatLabel}>THREAT LEVEL</Text>
                       <Text style={styles.threatValue}>6% NORMAL</Text>
                    </View>
                 </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Events Log */}
        <View style={styles.eventsSection}>
           <View style={styles.eventsHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                 <AlertCircle size={16} color="#9ca3af" />
                 <Text style={styles.eventsTitle}>RECENT INCIDENTS</Text>
              </View>
              <TouchableOpacity onPress={generateDigest} disabled={isGeneratingDigest}>
                 <Text style={{color: '#60a5fa', fontSize: 10, fontWeight: 'bold'}}>{isGeneratingDigest ? 'GENERATING...' : 'AI SUMMARY'}</Text>
              </TouchableOpacity>
           </View>
           
           <View style={styles.eventsList}>
             {STUB_EVENTS.map(ev => (
                <TouchableOpacity key={ev.id} style={styles.eventCard} onPress={() => setSelectedEvent(ev)} activeOpacity={0.8}>
                  <View style={styles.eventImagePlaceholder}>
                     {ev.hasVideo && (
                        <View style={{position:'absolute', inset: 0, justifyContent:'center', alignItems:'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius:8}}>
                           <PlayCircle color="#fff" size={24} />
                        </View>
                     )}
                  </View>
                  <View style={styles.eventInfo}>
                     <View style={styles.eventTop}>
                       <Text style={[styles.eventBadge, { backgroundColor: ev.type === 'theft' ? '#991b1b' : '#854d0e' }]}>{ev.type.toUpperCase()}</Text>
                       <Text style={styles.eventTime}>{ev.time}</Text>
                     </View>
                     <Text style={styles.eventDesc}>{ev.desc}</Text>
                  </View>
                </TouchableOpacity>
             ))}
           </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
         <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconBox}>
               <FolderOpen size={20} color="#9ca3af" />
            </View>
            <Text style={styles.navText}>Test Feed</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.fabItem}>
            <View style={styles.fabInner}>
               <Camera size={24} color="#ffffff" />
            </View>
            <Text style={styles.fabText}>Camera</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.navItem}>
            <View style={styles.navIconBox}>
               <Settings size={20} color="#9ca3af" />
            </View>
            <Text style={styles.navText}>Settings</Text>
         </TouchableOpacity>
      </View>

      {/* Digest Modal */}
      {dailyDigest && (
         <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
            <View style={{ backgroundColor: '#111', borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: '#1f2937' }}>
               <Text style={{ color: '#60a5fa', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Security Digest</Text>
               <Text style={{ color: '#d1d5db', fontSize: 14, lineHeight: 22 }}>{dailyDigest}</Text>
               <TouchableOpacity onPress={() => setDailyDigest(null)} style={{ marginTop: 24, alignSelf: 'flex-end', backgroundColor: '#1f2937', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Close</Text>
               </TouchableOpacity>
            </View>
         </View>
      )}

      {/* Event Replay Modal */}
      {selectedEvent && (
         <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }]}>
            <View style={{ backgroundColor: '#111', borderRadius: 16, width: '100%', borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden' }}>
               
               <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937', backgroundColor: '#1a1a1a'}}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedEvent.type} Incident</Text>
                  <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                     <X color="#9ca3af" size={20} />
                  </TouchableOpacity>
               </View>

               <View style={{ height: 220, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                  {selectedEvent.hasVideo ? (
                     <View style={{alignItems: 'center'}}>
                        <PlayCircle color="#3b82f6" size={48} />
                        <Text style={{color: '#6b7280', marginTop: 8, fontSize: 12}}>Video Clip Ready (1:00)</Text>
                     </View>
                  ) : (
                     <View style={{alignItems: 'center'}}>
                        <Camera color="#4b5563" size={32} />
                        <Text style={{color: '#6b7280', marginTop: 8, fontSize: 12}}>No Video Available</Text>
                     </View>
                  )}
               </View>

               <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                     <Text style={{ color: '#6b7280', fontSize: 12 }}>{selectedEvent.time}</Text>
                     <Text style={{ color: '#9ca3af', fontSize: 10, fontWeight: 'bold', backgroundColor: '#1f2937', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        {selectedEvent.conf * 100}% CONFIDENCE
                     </Text>
                  </View>
                  <Text style={{ color: '#d1d5db', fontSize: 14 }}>{selectedEvent.desc}</Text>
               </View>
            </View>
         </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 6,
    borderRadius: 20
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 10,
    letterSpacing: 2
  },
  profileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16
  },
  profileText: {
    color: '#d1d5db',
    fontSize: 12
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100
  },
  emptyState: {
    height: 250,
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyStateTitle: {
    color: '#d1d5db',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16
  },
  emptyStateSub: {
    color: '#6b7280',
    marginTop: 8
  },
  feedsList: {
    gap: 12,
    marginBottom: 16
  },
  feedCard: {
    height: 240,
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden'
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12
  },
  feedStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold'
  },
  feedName: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10
  },
  threatLayer: {
    position: 'absolute',
    bottom: 12,
    left: 12
  },
  threatLabel: {
    color: '#9ca3af',
    fontSize: 8,
    letterSpacing: 1
  },
  threatValue: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 16
  },
  eventsSection: {
    gap: 12
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  eventsTitle: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2
  },
  eventsList: {
    gap: 8
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    gap: 12
  },
  eventImagePlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#222',
    borderRadius: 8
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  eventTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  eventBadge: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden'
  },
  eventTime: {
    color: '#6b7280',
    fontSize: 10
  },
  eventDesc: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingVertical: 12,
    paddingBottom: 24
  },
  navItem: {
    alignItems: 'center',
    width: 80,
    gap: 4
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '500'
  },
  fabItem: {
    alignItems: 'center',
    width: 80,
    marginTop: -28,
    gap: 4
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#000',
    shadowColor: '#2563eb',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  fabText: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '500'
  }
});
