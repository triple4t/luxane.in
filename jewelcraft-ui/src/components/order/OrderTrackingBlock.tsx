import { useState } from "react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Truck, ExternalLink, Loader2, ChevronDown, ChevronUp } from "lucide-react";

type Tracking = {
  awbCode: string | null;
  courierName: string | null;
  currentStatus: string | null;
  deliveredDate: string | null;
  scan: Array<{ date: string; time: string; activity: string; location: string }>;
  trackUrl: string | null;
};

type Props = {
  orderId: string;
  hasShiprocket?: boolean;
  compact?: boolean;
};

export function OrderTrackingBlock({ orderId, hasShiprocket = false, compact }: Props) {
  const [tracking, setTracking] = useState<Tracking | null | undefined>(undefined);
  const [noTrackingMessage, setNoTrackingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchTracking = async () => {
    if (tracking !== undefined) {
      setExpanded((e) => !e);
      return;
    }
    setLoading(true);
    setNoTrackingMessage(null);
    try {
      const res = await api.getOrderTracking(orderId);
      setTracking(res.data.tracking ?? null);
      setNoTrackingMessage(res.data.message ?? null);
      setExpanded(true);
    } catch {
      setTracking(null);
      setNoTrackingMessage("Could not load tracking.");
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  const showContent = expanded && tracking !== undefined;

  return (
    <div className="mt-4 pt-4 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={fetchTracking}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Truck className="h-4 w-4" />
        )}
        {tracking === undefined ? "Track shipment" : "Shiprocket tracking"}
        {showContent && (expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </Button>

      {showContent && (
        <div className="mt-3 rounded-md bg-muted/50 p-4 text-sm space-y-2">
          {tracking === null ? (
            <p className="text-muted-foreground">
              {noTrackingMessage || "No tracking details available yet. The shipment may not have been picked up."}
            </p>
          ) : (
            <>
              {tracking.currentStatus && (
                <p>
                  <span className="font-medium">Status:</span> {tracking.currentStatus}
                </p>
              )}
              {tracking.courierName && (
                <p>
                  <span className="font-medium">Courier:</span> {tracking.courierName}
                </p>
              )}
              {tracking.awbCode && (
                <p>
                  <span className="font-medium">AWB:</span> {tracking.awbCode}
                </p>
              )}
              {tracking.deliveredDate && (
                <p>
                  <span className="font-medium">Delivered:</span> {tracking.deliveredDate}
                </p>
              )}
              {tracking.scan?.length > 0 && !compact && (
                <div className="mt-2">
                  <p className="font-medium mb-1">Activity</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {tracking.scan.slice(0, 5).map((s, i) => (
                      <li key={i}>
                        {s.date} {s.time} — {s.activity}
                        {s.location ? ` (${s.location})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tracking.trackUrl && (
                <Button variant="link" size="sm" className="p-0 h-auto mt-2 gap-1" asChild>
                  <a href={tracking.trackUrl} target="_blank" rel="noopener noreferrer">
                    Open in Shiprocket <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              {!tracking.currentStatus && !tracking.courierName && !tracking.awbCode && !tracking.deliveredDate && (!tracking.scan?.length) && !tracking.trackUrl && (
                <p className="text-muted-foreground">
                  Tracking is being updated. Check back in a while or check your Shiprocket dashboard.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
