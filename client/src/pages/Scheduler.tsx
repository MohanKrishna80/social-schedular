import { useEffect, useState } from "react";
import { PLATFORMS } from "../assets/assets";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  SendIcon,
  XIcon,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const Scheduler = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get("/api/posts");
      setPosts(data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch posts"
      );
    }
  };

  useEffect(() => {
    fetchPosts();

    const interval = setInterval(fetchPosts, 10000);

    return () => clearInterval(interval);
  }, []);

  const scheduled = posts.filter(
    (post) => post.status === "scheduled"
  );

  const published = posts.filter(
    (post) => post.status === "published"
  );

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id)
        ? prev.filter((platform) => platform !== id)
        : [...prev, id]
    );
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error("Select date and time");
      return;
    }

    if (
      selectedPlatforms.includes("instagram") &&
      !mediaFile
    ) {
      toast.error("Instagram requires an image or video");
      return;
    }

    const scheduledForDate = new Date(
      `${scheduledDate}T${scheduledTime}`
    );

    if (scheduledForDate < new Date()) {
      toast.error("Please select a future date and time");
      return;
    }

    const formData = new FormData();

    formData.append("content", content);
    formData.append(
      "scheduledFor",
      scheduledForDate.toISOString()
    );
    formData.append("status", "scheduled");
    formData.append(
      "platforms",
      JSON.stringify(selectedPlatforms)
    );

    if (mediaFile) {
      formData.append("media", mediaFile);
    }

    setLoading(true);

    try {
      await api.post("/api/posts", formData);

      toast.success("Post scheduled!");

      setContent("");
      setScheduledDate("");
      setScheduledTime("");
      setSelectedPlatforms([]);
      setMediaFile(null);

      await fetchPosts();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    try {
      setIsGenerating(true);
  
      const { data } = await api.post("/api/content/generate-content", {
        prompt: content,
      });
  
      setContent(data.content);
      toast.success("Content generated successfully");
    } catch (error) {
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Compose Panel */}
      <div className="w-full lg:w-[460px] shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg text-slate-700 dark:text-slate-100">Compose Post</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSchedule}>
            {/* Platforms */}

            <div>
              <label className="block text-xs text-slate-500 uppercase mb-2 dark:text-slate-400">
                Platforms
              </label>

              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p.id);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 p-3 rounded-md border transition-all duration-150 ${
                        active
                          ? "bg-red-50 border-red-300 text-red-500 scale-105"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <p.icon className="size-4.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}

            <div>
  <label className="block text-xs text-slate-500 uppercase mb-2 dark:text-slate-400">
    Content
  </label>

  <div className="space-y-3">
    <textarea
      required
      rows={5}
      placeholder="What do you want to share today?"
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder-slate-400 outline-none resize-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />

    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={handleGenerateAI}
        disabled={isGenerating || !content.trim()}
        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "✨ Generate with AI"}
      </button>

      <div
        className={`text-xs font-medium ${
          content.length > 1900? "text-red-500" : "text-slate-400"
        }`}
      >
        {content.length}/2000
      </div>
    </div>
  </div>
</div>

            {/* Media upload */}
            <div>
              <label className="block text-xs text-slate-500 uppercase mb-2 dark:text-slate-400">
                Media (optional)
              </label>

              {mediaFile ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                  {mediaFile.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(mediaFile)}
                      alt="preview"
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(mediaFile)}
                      className="w-full h-40 object-cover"
                      controls
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaFile(null)}
                    className="absolute top-2 right-2 size-7 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label
                htmlFor="media-upload"
                className="flex items-center justify-center gap-2 p-5 py-10 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group dark:border-slate-700 dark:hover:border-red-500/40 dark:hover:bg-red-500/10"
              >
                <span className="text-sm text-slate-500 group-hover:text-red-600 transition-colors dark:text-slate-400 dark:group-hover:text-red-300">
                  Click to upload image or video
                </span>
              </label>
              )}

              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setMediaFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Date & Time */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-2 dark:text-slate-400">
                  Date
                </label>

                <div className="relative">
                  <CalendarIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                  <input
                    type="date"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase mb-2 dark:text-slate-400">
                  Time
                </label>

                <div className="relative">
                  <ClockIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                  <input
                    type="time"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 hover:bg-red-600 transition-all text-white rounded-lg"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  Schedule Post
                  <ArrowRightIcon className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Queue Panels */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <CalendarDaysIcon className="size-4 text-zinc-500 dark:text-slate-400" />

            <h3 className="text-slate-900 text-sm dark:text-slate-100">Upcoming</h3>

            <span className="ml-auto text-xs font-bold text-zinc-700 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-800 dark:text-slate-300">
              {scheduled.length}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {scheduled.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm dark:text-slate-500">
                No posts scheduled yet
              </div>
            ) : (
              scheduled.map((post) => (
                <div
                  key={post._id}
                  className="px-5 py-4 hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-800/70"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {post.platforms.map((pl: string) => {
                        const meta = PLATFORMS.find((p) => p.id === pl);

                        return meta ? (
                          <meta.icon
                            key={pl}
                            className="size-3.5 text-slate-400 dark:text-slate-500"
                          />
                        ) : null;
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      {post.mediaType && (
                        <span className="text-xs text-slate-600 border border-slate-200 bg-slate-100 px-1.5 py-0.5 rounded-md font-semibold capitalize dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800">
                          {post.mediaType}
                        </span>
                      )}

                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(post.scheduledFor).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Post content*/}

                  <p className="text-sm text-slate-500 line-clamp-2 max-w-md dark:text-slate-300">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Published */}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <SendIcon className="size-4 text-zinc-500 dark:text-slate-400" />

            <h3 className="text-slate-900 text-sm dark:text-slate-100">Published</h3>

            <span className="ml-auto text-xs font-bold text-zinc-700 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-800 dark:text-slate-300">
              {published.length}
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {published.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm dark:text-slate-500">
                No posts published yet
              </div>
            ) : (
              published.map((post) => (
                <div
                  key={post._id}
                  className="px-5 py-4 hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-800/70"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {post.platforms.map((pl: string) => {
                        const meta = PLATFORMS.find((p) => p.id === pl);

                        return meta ? (
                          <meta.icon
                            key={pl}
                            className="size-3.5 text-slate-400 dark:text-slate-500"
                          />
                        ) : null;
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      {post.mediaType && (
                        <span className="text-xs text-slate-600 border border-slate-200 bg-slate-100 px-1.5 py-0.5 rounded-md font-semibold capitalize dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800">
                          {post.mediaType}
                        </span>
                      )}

                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(post.updatedAt).toLocaleString()}
                      </span>
                      <span className="text-xs text-emerald-700 border bg-emerald-50 border-emerald-100 px-2 py-0.5 rounded-full dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                        Published
                      </span>
                    </div>
                  </div>

                  {/* Post content*/}

                  <p className="text-sm text-slate-500 line-clamp-2 max-w-4/5 dark:text-slate-300">
                    {post.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;
