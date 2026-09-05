// ============================================================================
// UnMoGrowP Attribution Platform - Week 3 Customer Acquisition Engine
// Systematic customer onboarding: 10-15 new customers in 7 days
// ============================================================================

import { EventEmitter } from 'events';

export interface CustomerLead {
  id: string;
  companyName: string;
  industry: string;
  size: string;
  contactPerson: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
  painPoints: string[];
  estimatedMRR: number;
  priority: 'high' | 'medium' | 'low';
  status: 'cold' | 'contacted' | 'demo_scheduled' | 'negotiating' | 'onboarded' | 'lost';
  lastContact?: Date;
  nextFollowUp?: Date;
}

export interface AcquisitionCampaign {
  id: string;
  name: string;
  segment: string;
  targetCount: number;
  currentCount: number;
  leads: CustomerLead[];
  valueProposition: string;
  successRate: number; // percentage
}

export class Week3CustomerAcquisitionEngine extends EventEmitter {
  private campaigns: Map<string, AcquisitionCampaign> = new Map();
  private leads: Map<string, CustomerLead> = new Map();
  private onboardedCustomers: Set<string> = new Set();
  private acquisitionStartTime: Date;

  constructor() {
    super();
    this.acquisitionStartTime = new Date();
    this.initializeAcquisitionCampaigns();
  }

  // ========================================================================
  // Customer Acquisition Campaign Initialization
  // ========================================================================

  private initializeAcquisitionCampaigns(): void {
    console.log('🎯 Initializing Customer Acquisition Campaigns');

    const campaigns: AcquisitionCampaign[] = [
      {
        id: 'mobile-gaming',
        name: 'Mobile Gaming Attribution',
        segment: 'Mobile Gaming Companies',
        targetCount: 4,
        currentCount: 0,
        leads: [],
        valueProposition: 'Increase ROAS by 35% with precise mobile gaming attribution',
        successRate: 25 // 1 in 4 conversion rate
      },
      {
        id: 'ecommerce-apps',
        name: 'E-commerce Cross-Platform',
        segment: 'E-commerce Apps',
        targetCount: 5,
        currentCount: 0,
        leads: [],
        valueProposition: 'Unified cross-platform attribution for 40% better customer insights',
        successRate: 30 // 3 in 10 conversion rate
      },
      {
        id: 'financial-apps',
        name: 'Financial Compliance-Ready',
        segment: 'Financial Apps',
        targetCount: 3,
        currentCount: 0,
        leads: [],
        valueProposition: 'SOC2 compliant attribution with 99.9% accuracy for financial apps',
        successRate: 20 // 1 in 5 conversion rate (high value, selective)
      },
      {
        id: 'travel-hospitality',
        name: 'Travel Multi-Channel',
        segment: 'Travel & Hospitality Apps',
        targetCount: 3,
        currentCount: 0,
        leads: [],
        valueProposition: 'Multi-channel attribution clarity for complex travel customer journeys',
        successRate: 25
      }
    ];

    campaigns.forEach(campaign => {
      this.campaigns.set(campaign.id, campaign);
      console.log(`📈 Campaign ready: ${campaign.name} (Target: ${campaign.targetCount})`);
    });

    this.generateInitialLeads();
  }

  private generateInitialLeads(): void {
    console.log('🎪 Generating initial lead database...');

    const leadDatabase = [
      // Mobile Gaming Companies
      {
        id: 'lead-001',
        companyName: 'GameStorm Studios',
        industry: 'Mobile Gaming',
        size: '50-200 employees',
        contactPerson: {
          name: 'Sarah Chen',
          role: 'Head of User Acquisition',
          email: 'sarah.chen@gamestorm.com'
        },
        painPoints: ['High CAC', 'Inaccurate LTV calculations', 'Attribution delays'],
        estimatedMRR: 4500,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'mobile-gaming'
      },
      {
        id: 'lead-002',
        companyName: 'Puzzle Kingdom',
        industry: 'Mobile Gaming',
        size: '100-500 employees',
        contactPerson: {
          name: 'Mike Rodriguez',
          role: 'Growth Marketing Director',
          email: 'mike.r@puzzlekingdom.app'
        },
        painPoints: ['Cross-platform attribution gaps', 'IDFA impact on tracking'],
        estimatedMRR: 3800,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'mobile-gaming'
      },
      {
        id: 'lead-003',
        companyName: 'Battle Arena Games',
        industry: 'Mobile Gaming',
        size: '200-1000 employees',
        contactPerson: {
          name: 'Lisa Park',
          role: 'VP Marketing',
          email: 'lisa.park@battlearena.games'
        },
        painPoints: ['Attribution fraud detection', 'Multi-geo campaign tracking'],
        estimatedMRR: 5200,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'mobile-gaming'
      },
      {
        id: 'lead-004',
        companyName: 'Casual Games Co',
        industry: 'Mobile Gaming',
        size: '30-100 employees',
        contactPerson: {
          name: 'Tom Wilson',
          role: 'Marketing Manager',
          email: 'tom@casualgames.co'
        },
        painPoints: ['Limited attribution budget', 'Need simple setup'],
        estimatedMRR: 2800,
        priority: 'medium' as const,
        status: 'cold' as const,
        campaign: 'mobile-gaming'
      },

      // E-commerce Apps
      {
        id: 'lead-005',
        companyName: 'ShopFast Mobile',
        industry: 'E-commerce',
        size: '200-500 employees',
        contactPerson: {
          name: 'Emma Davis',
          role: 'Head of Growth',
          email: 'emma@shopfast.app'
        },
        painPoints: ['Web-to-app attribution', 'Customer journey complexity'],
        estimatedMRR: 6200,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'ecommerce-apps'
      },
      {
        id: 'lead-006',
        companyName: 'Fashion Forward',
        industry: 'E-commerce',
        size: '100-300 employees',
        contactPerson: {
          name: 'Alex Kumar',
          role: 'Digital Marketing Director',
          email: 'alex@fashionforward.com'
        },
        painPoints: ['Social media attribution', 'Influencer campaign tracking'],
        estimatedMRR: 4800,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'ecommerce-apps'
      },

      // Financial Apps
      {
        id: 'lead-007',
        companyName: 'FinTech Pro',
        industry: 'Financial Services',
        size: '500-2000 employees',
        contactPerson: {
          name: 'David Morgan',
          role: 'Chief Marketing Officer',
          email: 'david.morgan@fintechpro.com'
        },
        painPoints: ['Compliance requirements', 'Privacy-first attribution'],
        estimatedMRR: 8500,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'financial-apps'
      },
      {
        id: 'lead-008',
        companyName: 'CryptoWallet Plus',
        industry: 'Financial Services',
        size: '100-500 employees',
        contactPerson: {
          name: 'Rachel Stone',
          role: 'VP Growth',
          email: 'rachel@cryptowalletplus.io'
        },
        painPoints: ['Attribution fraud in crypto space', 'Cross-border tracking'],
        estimatedMRR: 6800,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'financial-apps'
      },

      // Travel & Hospitality
      {
        id: 'lead-009',
        companyName: 'TravelEase App',
        industry: 'Travel',
        size: '150-300 employees',
        contactPerson: {
          name: 'Maria Gonzalez',
          role: 'Head of Digital Marketing',
          email: 'maria@travelease.app'
        },
        painPoints: ['Long conversion cycles', 'Multi-device bookings'],
        estimatedMRR: 3600,
        priority: 'medium' as const,
        status: 'cold' as const,
        campaign: 'travel-hospitality'
      },
      {
        id: 'lead-010',
        companyName: 'Hotel Booking Pro',
        industry: 'Travel',
        size: '200-600 employees',
        contactPerson: {
          name: 'James Brown',
          role: 'Marketing Director',
          email: 'james@hotelbookingpro.com'
        },
        painPoints: ['Attribution across booking partners', 'Mobile vs web performance'],
        estimatedMRR: 4200,
        priority: 'high' as const,
        status: 'cold' as const,
        campaign: 'travel-hospitality'
      }
    ];

    leadDatabase.forEach(leadData => {
      const lead: CustomerLead = {
        ...leadData,
        nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000) // Follow up in 24 hours
      };

      this.leads.set(lead.id, lead);

      // Add to appropriate campaign
      const campaign = this.campaigns.get(leadData.campaign);
      if (campaign) {
        campaign.leads.push(lead);
      }
    });

    console.log(`📊 Generated ${leadDatabase.length} high-quality leads across all segments`);
  }

  // ========================================================================
  // Customer Acquisition Execution
  // ========================================================================

  async executeAcquisitionCampaigns(): Promise<void> {
    console.log('🚀 EXECUTING CUSTOMER ACQUISITION CAMPAIGNS');
    console.log('🎯 Goal: 10-15 new customers in 7 days');

    for (const [campaignId, campaign] of this.campaigns) {
      console.log(`\n📈 Starting campaign: ${campaign.name}`);
      await this.executeCampaign(campaign);
    }

    console.log('\n✅ All acquisition campaigns launched successfully');
    this.startContinuousFollowUp();
  }

  private async executeCampaign(campaign: AcquisitionCampaign): Promise<void> {
    console.log(`🎪 Executing ${campaign.name} - Target: ${campaign.targetCount} customers`);

    const leadsToContact = campaign.leads.filter(lead => lead.status === 'cold');

    for (const lead of leadsToContact) {
      await this.contactLead(lead, campaign);

      // Simulate realistic timing between contacts
      await this.delay(5000 + Math.random() * 10000); // 5-15 seconds between contacts
    }

    console.log(`📞 Contacted ${leadsToContact.length} leads for ${campaign.name}`);
  }

  private async contactLead(lead: CustomerLead, campaign: AcquisitionCampaign): Promise<void> {
    console.log(`📞 Contacting: ${lead.companyName} (${lead.contactPerson.name})`);

    // Update lead status
    lead.status = 'contacted';
    lead.lastContact = new Date();
    lead.nextFollowUp = new Date(Date.now() + 48 * 60 * 60 * 1000); // Follow up in 48 hours

    // Simulate personalized outreach
    const personalizedMessage = this.generatePersonalizedOutreach(lead, campaign);
    console.log(`✉️  Sent: ${personalizedMessage.subject}`);

    // Simulate response probability based on lead quality
    const responseChance = this.calculateResponseChance(lead);
    if (Math.random() < responseChance) {
      await this.handleLeadResponse(lead, campaign);
    }

    this.emit('lead_contacted', { lead, campaign, message: personalizedMessage });
  }

  private generatePersonalizedOutreach(lead: CustomerLead, campaign: AcquisitionCampaign): any {
    const painPointText = lead.painPoints.join(', ');

    return {
      to: lead.contactPerson.email,
      subject: `Solve ${lead.painPoints[0]} - ${campaign.valueProposition}`,
      preview: `Hi ${lead.contactPerson.name}, I noticed ${lead.companyName} is dealing with ${painPointText}...`,
      callToAction: 'Book 15-min demo to see how we helped similar companies increase ROAS by 35%',
      valueProposition: campaign.valueProposition,
      socialProof: '2 pilot customers already achieving 35%+ ROAS improvement'
    };
  }

  private calculateResponseChance(lead: CustomerLead): number {
    let baseChance = 0.15; // 15% base response rate

    // Adjust based on priority
    if (lead.priority === 'high') baseChance *= 1.5;
    if (lead.priority === 'low') baseChance *= 0.7;

    // Adjust based on estimated MRR (higher value = more interested)
    if (lead.estimatedMRR > 5000) baseChance *= 1.3;
    if (lead.estimatedMRR < 3000) baseChance *= 0.8;

    return Math.min(baseChance, 0.4); // Cap at 40% max response rate
  }

  private async handleLeadResponse(lead: CustomerLead, campaign: AcquisitionCampaign): Promise<void> {
    console.log(`📬 Response received from ${lead.companyName}!`);

    lead.status = 'demo_scheduled';
    lead.nextFollowUp = new Date(Date.now() + 24 * 60 * 60 * 1000); // Demo in 24 hours

    // Simulate demo and negotiation process
    setTimeout(async () => {
      await this.processDemoAndNegotiation(lead, campaign);
    }, 30000 + Math.random() * 60000); // 30-90 seconds for demo simulation

    this.emit('lead_responded', { lead, campaign });
  }

  private async processDemoAndNegotiation(lead: CustomerLead, campaign: AcquisitionCampaign): Promise<void> {
    console.log(`🎥 Demo completed with ${lead.companyName}`);

    lead.status = 'negotiating';

    // Calculate conversion probability based on campaign success rate
    const conversionChance = campaign.successRate / 100;
    const willConvert = Math.random() < conversionChance;

    if (willConvert) {
      await this.onboardCustomer(lead, campaign);
    } else {
      lead.status = 'lost';
      console.log(`❌ Lost: ${lead.companyName} - not ready to commit`);
      this.emit('lead_lost', { lead, campaign, reason: 'not_ready_to_commit' });
    }
  }

  private async onboardCustomer(lead: CustomerLead, campaign: AcquisitionCampaign): Promise<void> {
    console.log(`🎉 CUSTOMER ONBOARDED: ${lead.companyName} - $${lead.estimatedMRR} MRR`);

    lead.status = 'onboarded';
    this.onboardedCustomers.add(lead.id);
    campaign.currentCount++;

    // Create customer profile for tracking
    const customerProfile = {
      id: lead.id,
      companyName: lead.companyName,
      industry: lead.industry,
      mrr: lead.estimatedMRR,
      onboardedDate: new Date(),
      satisfactionScore: 0, // Will be updated by customer success tracking
      healthScore: 100,
      campaignSource: campaign.id
    };

    this.emit('customer_onboarded', customerProfile);

    // Check if campaign target is met
    if (campaign.currentCount >= campaign.targetCount) {
      console.log(`🏆 Campaign SUCCESS: ${campaign.name} reached target (${campaign.currentCount}/${campaign.targetCount})`);
      this.emit('campaign_target_met', { campaign });
    }
  }

  // ========================================================================
  // Continuous Follow-up and Optimization
  // ========================================================================

  private startContinuousFollowUp(): void {
    console.log('🔄 Starting continuous follow-up system');

    // Check for follow-ups every 30 seconds
    setInterval(() => {
      this.processFollowUps();
    }, 30000);

    // Daily campaign optimization
    setInterval(() => {
      this.optimizeCampaigns();
    }, 24 * 60 * 60 * 1000);
  }

  private processFollowUps(): void {
    const now = new Date();

    for (const [leadId, lead] of this.leads) {
      if (lead.nextFollowUp && lead.nextFollowUp <= now &&
          ['contacted', 'demo_scheduled', 'negotiating'].includes(lead.status)) {

        this.followUpWithLead(lead);
      }
    }
  }

  private async followUpWithLead(lead: CustomerLead): Promise<void> {
    console.log(`🔔 Follow-up: ${lead.companyName}`);

    // Update next follow-up time
    lead.nextFollowUp = new Date(Date.now() + 72 * 60 * 60 * 1000); // Follow up in 3 days
    lead.lastContact = new Date();

    // Simulate follow-up effectiveness
    if (lead.status === 'demo_scheduled') {
      // Convert demo to negotiation
      lead.status = 'negotiating';

      const campaign = this.campaigns.get(lead.campaign);
      if (campaign) {
        setTimeout(() => {
          this.processDemoAndNegotiation(lead, campaign);
        }, 10000 + Math.random() * 20000); // 10-30 seconds
      }
    }

    this.emit('follow_up_sent', { lead });
  }

  private optimizeCampaigns(): void {
    console.log('📊 Daily campaign optimization');

    for (const [campaignId, campaign] of this.campaigns) {
      const contactedLeads = campaign.leads.filter(l => l.status !== 'cold').length;
      const onboardedLeads = campaign.leads.filter(l => l.status === 'onboarded').length;

      if (contactedLeads > 0) {
        const actualSuccessRate = (onboardedLeads / contactedLeads) * 100;
        console.log(`📈 ${campaign.name}: ${actualSuccessRate.toFixed(1)}% success rate (${onboardedLeads}/${contactedLeads})`);

        // Update campaign success rate for better predictions
        campaign.successRate = (campaign.successRate + actualSuccessRate) / 2;
      }
    }
  }

  // ========================================================================
  // Reporting and Analytics
  // ========================================================================

  getAcquisitionStatus(): any {
    const totalCustomers = this.onboardedCustomers.size;
    const totalMRR = Array.from(this.leads.values())
      .filter(lead => lead.status === 'onboarded')
      .reduce((sum, lead) => sum + lead.estimatedMRR, 0);

    const campaignResults = Array.from(this.campaigns.values()).map(campaign => ({
      name: campaign.name,
      target: campaign.targetCount,
      current: campaign.currentCount,
      progress: `${Math.round((campaign.currentCount / campaign.targetCount) * 100)}%`,
      successRate: `${campaign.successRate.toFixed(1)}%`
    }));

    const elapsedHours = Math.round((Date.now() - this.acquisitionStartTime.getTime()) / (1000 * 60 * 60));

    return {
      summary: {
        totalCustomersOnboarded: totalCustomers,
        targetRange: '10-15',
        progressToTarget: `${Math.round((totalCustomers / 12.5) * 100)}%`, // Mid-point of 10-15
        totalMRR: `$${totalMRR.toLocaleString()}`,
        averageMRR: totalCustomers > 0 ? `$${Math.round(totalMRR / totalCustomers).toLocaleString()}` : '$0',
        elapsedHours: elapsedHours,
        acquisitionRate: totalCustomers > 0 ? `${(totalCustomers / Math.max(elapsedHours, 1)).toFixed(1)}/hour` : '0/hour'
      },
      campaigns: campaignResults,
      pipeline: {
        cold: Array.from(this.leads.values()).filter(l => l.status === 'cold').length,
        contacted: Array.from(this.leads.values()).filter(l => l.status === 'contacted').length,
        demoScheduled: Array.from(this.leads.values()).filter(l => l.status === 'demo_scheduled').length,
        negotiating: Array.from(this.leads.values()).filter(l => l.status === 'negotiating').length,
        onboarded: Array.from(this.leads.values()).filter(l => l.status === 'onboarded').length,
        lost: Array.from(this.leads.values()).filter(l => l.status === 'lost').length
      }
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  shutdown(): void {
    console.log('🔌 Customer Acquisition Engine shutting down');
    this.removeAllListeners();
  }
}

export default Week3CustomerAcquisitionEngine;