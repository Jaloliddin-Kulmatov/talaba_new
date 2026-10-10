"use client";

import dynamic from "next/dynamic";

// The AI chat and feedback widgets are never needed for the first paint, so they load after
// the page is interactive instead of weighing on every route's initial JavaScript.
const ChatWidget = dynamic(() => import("@/components/ai/chat-widget"), { ssr: false });
const FeedbackWidget = dynamic(() => import("@/components/feedback/feedback-widget"), { ssr: false });

export default function LazyWidgets() {
  return (
    <>
      <FeedbackWidget />
      {/* AI floating button — desktop only (hidden on mobile) */}
      <div className="hidden md:block">
        <ChatWidget />
      </div>
    </>
  );
}
