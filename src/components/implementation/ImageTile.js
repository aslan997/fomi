"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import clsx from "clsx";
import { Download, Heart, Maximize2, Play } from "lucide-react";
import { assetFilename, downloadAsset } from "@/lib/download";
import { useStudio } from "./StudioProvider";

const actionClass =
  "grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-[background-color,transform] duration-150 hover:bg-black/65 active:scale-90";

export function ImageTile({ image, aspect, index }) {
  const { favorites, toggleFavorite, openPreview, announce } = useStudio();
  const [downloading, setDownloading] = useState(false);
  const videoRef = useRef(null);
  const favorite = Boolean(favorites[image.id]);
  const isVideo = Boolean(image.videoUrl);
  const label = `${isVideo ? "Video" : "Image"} ${index + 1}: ${image.alt}`;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadAsset(image.videoUrl ?? image.url, assetFilename(image));
      announce("Download started.");
    } catch {
      announce("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Video tiles preview on hover; the poster image is shown otherwise.
  const playPreview = () => videoRef.current?.play().catch(() => {});
  const stopPreview = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <div
      className="group/tile relative overflow-hidden rounded-[8px] bg-st-card"
      style={{ aspectRatio: aspect }}
      onPointerEnter={isVideo ? playPreview : undefined}
      onPointerLeave={isVideo ? stopPreview : undefined}
    >
      <button
        type="button"
        onClick={() => openPreview(image.id)}
        aria-label={`Open preview — ${label}`}
        className="absolute inset-0 block h-full w-full cursor-zoom-in focus-visible:outline-offset-[-3px]"
      >
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 190px, (min-width: 640px) 22vw, 46vw"
          className="object-cover transition-transform duration-300 ease-out group-hover/tile:scale-[1.03]"
        />
        {isVideo && (
          <video
            ref={videoRef}
            src={image.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-200 group-hover/tile:opacity-100"
          />
        )}
      </button>

      {isVideo && (
        <span className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          <Play size={10} fill="currentColor" aria-hidden="true" />
          0:0{image.durationSeconds}
        </span>
      )}

      <div
        className={clsx(
          "absolute top-2 right-2 flex flex-col gap-1.5 transition-opacity duration-150",
          "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/tile:opacity-100 [@media(hover:hover)]:group-focus-within/tile:opacity-100"
        )}
      >
        <button
          type="button"
          onClick={() => toggleFavorite(image.id)}
          aria-pressed={favorite}
          aria-label={favorite ? "Remove from saved" : "Save"}
          className={actionClass}
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} className={clsx(favorite && "text-[#ff8a73]")} aria-hidden="true" />
        </button>
        <button type="button" onClick={download} disabled={downloading} aria-label="Download" className={clsx(actionClass, downloading && "opacity-60")}>
          <Download size={15} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => openPreview(image.id)} aria-label="Expand" tabIndex={-1} className={clsx(actionClass, "hidden sm:grid")}>
          <Maximize2 size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Saved items stay marked even when the action bar is hidden. */}
      {favorite && (
        <Heart
          size={14}
          fill="currentColor"
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-3 text-[#ff8a73] drop-shadow transition-opacity duration-150 [@media(hover:hover)]:group-hover/tile:opacity-0"
        />
      )}
    </div>
  );
}
