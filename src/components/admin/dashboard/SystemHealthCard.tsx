'use client';

import { useEffect, useState } from 'react';
import {
  Database,
  Wifi,
  HardDrive,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';

type ServiceStatus = 'UP' | 'DEGRADED' | 'DOWN' | 'CHECKING';

interface Service {
  name: string;
  icon: any;
  status: ServiceStatus;
}

export default function SystemHealthCard() {
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([
    { name: 'Database', icon: Database, status: 'CHECKING' },
    { name: 'Realtime', icon: Wifi, status: 'CHECKING' },
    { name: 'Storage', icon: HardDrive, status: 'CHECKING' },
    { name: 'Auth Service', icon: Zap, status: 'CHECKING' },
  ]);

  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkHealth = async () => {
    const newServices: Service[] = [];

    // Check Database
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      newServices.push({
        name: 'Database',
        icon: Database,
        status: error ? 'DOWN' : 'UP',
      });
    } catch {
      newServices.push({ name: 'Database', icon: Database, status: 'DOWN' });
    }

    // Check Realtime (simplified - just check if channel can be created)
    try {
      const channel = supabase.channel('health-check');
      await new Promise((resolve) => setTimeout(resolve, 100));
      newServices.push({ name: 'Realtime', icon: Wifi, status: 'UP' });
      supabase.removeChannel(channel);
    } catch {
      newServices.push({ name: 'Realtime', icon: Wifi, status: 'DEGRADED' });
    }

    // Check Storage
    try {
      const { error } = await supabase.storage.listBuckets();
      newServices.push({
        name: 'Storage',
        icon: HardDrive,
        status: error ? 'DEGRADED' : 'UP',
      });
    } catch {
      newServices.push({ name: 'Storage', icon: HardDrive, status: 'DOWN' });
    }

    // Check Auth
    try {
      const { error } = await supabase.auth.getSession();
      newServices.push({
        name: 'Auth Service',
        icon: Zap,
        status: error ? 'DEGRADED' : 'UP',
      });
    } catch {
      newServices.push({ name: 'Auth Service', icon: Zap, status: 'DOWN' });
    }

    setServices(newServices);
    setLastCheck(new Date());
  };

  // Check on mount and every 60 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'UP':
        return 'bg-[#28C840]';
      case 'DEGRADED':
        return 'bg-[#FEBC2E]';
      case 'DOWN':
        return 'bg-[#FF5F57]';
      default:
        return 'bg-[#AEAEB2]';
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'UP':
        return { text: 'Operational', color: 'text-[#28C840]' };
      case 'DEGRADED':
        return { text: 'Degraded', color: 'text-[#FEBC2E]' };
      case 'DOWN':
        return { text: 'Down', color: 'text-[#FF5F57]' };
      default:
        return { text: 'Checking...', color: 'text-[#AEAEB2]' };
    }
  };

  const allUp = services.every((s) => s.status === 'UP');
  const anyDegraded = services.some((s) => s.status === 'DEGRADED');
  const anyDown = services.some((s) => s.status === 'DOWN');

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      {/* Titlebar */}
      <div className="flex h-[44px] items-center justify-between border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
        <div className="flex items-center gap-3">
          <TrafficLights size="xs" />
          <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
            System Health
          </span>
        </div>
        <span className="font-[DM_Sans] text-[11px] text-[#AEAEB2]">
          {formatTime(lastCheck)}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        {services.map((service) => {
          const statusInfo = getStatusText(service.status);
          return (
            <div
              key={service.name}
              className="flex items-center gap-3 rounded-xl bg-[#F5F5F7] p-3"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full ${getStatusColor(service.status)} ${
                  service.status === 'UP' ? 'animate-pulse' : ''
                }`}
              />
              <service.icon className="h-4 w-4 text-[#1D1D1F]" />
              <span className="flex-1 font-[DM_Sans] text-[13px] text-[#1D1D1F]">
                {service.name}
              </span>
              <span className={`font-[DM_Sans] text-[11px] font-semibold ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Overall Status */}
      <div className="border-t border-[rgba(0,0,0,0.06)] p-4">
        {allUp && (
          <div className="flex items-center gap-3 rounded-xl bg-[#EDFAF0] p-3">
            <CheckCircle2 className="h-5 w-5 text-[#28C840]" />
            <span className="font-[DM_Sans] text-[13px] font-semibold text-[#28C840]">
              All systems operational
            </span>
          </div>
        )}

        {!allUp && anyDegraded && !anyDown && (
          <div className="flex items-center gap-3 rounded-xl bg-[#FFF8EC] p-3">
            <AlertTriangle className="h-5 w-5 text-[#FEBC2E]" />
            <span className="font-[DM_Sans] text-[13px] font-semibold text-[#FEBC2E]">
              Some services degraded
            </span>
          </div>
        )}

        {anyDown && (
          <div className="flex items-center gap-3 rounded-xl bg-[#FFF0EF] p-3">
            <XCircle className="h-5 w-5 text-[#FF5F57]" />
            <span className="font-[DM_Sans] text-[13px] font-semibold text-[#FF5F57]">
              Service disruption detected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
