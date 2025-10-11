import { useEffect, useState } from "react";
import { Masonry } from "react-plock";
import "./RecentGlass.css";

interface GlassExif {
  camera?: string;
  lens?: string;
  aperture?: string;
  focal_length?: string;
  iso?: string;
  exposure_time?: string;
}

interface GlassPhoto {
  id: string;
  width: number;
  height: number;
  image640x640: string;
  share_url: string;
  created_at: string;
  caption?: string;
  exif?: GlassExif;
}

export default function RecentGlass() {
  const [photos, setPhotos] = useState<GlassPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGlassPhotos() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await fetch("/api/glass.json?limit=6");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: GlassPhoto[] = await response.json();
        setPhotos(data);
      } catch (error) {
        const msg = "Error fetching Glass photos: " + (error instanceof Error ? error.message : String(error));
        setErrorMsg(msg);
        console.error(msg);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGlassPhotos();
  }, []);

  if (isLoading) {
    return (
      <div className='recent-glass-container'>
        <h2>Recent from Glass</h2>
        <div className='recent-glass-loading'>Loading photos from Glass...</div>
      </div>
    );
  }

  return (
    <div className='recent-glass-container'>
      <Masonry
        items={photos}
        config={{
          columns: [2, 4, 6],
          gap: [16, 16, 32],
          media: [640, 768, 1024],
        }}
        render={(photo) => (
          <a href={photo.share_url} target='_blank' rel='noopener noreferrer' className='glass-photo' key={photo.id}>
            <img
              src={photo.image640x640}
              alt={photo.caption || "Photo from Glass"}
              width={photo.width}
              height={photo.height}
              loading='lazy'
            />
            <div className='overlay'>
              <div className='exif-info'>
                {photo.exif?.camera && <div className='exif-line'>{photo.exif.camera}</div>}
                {photo.exif?.lens && <div className='exif-line'>{photo.exif.lens}</div>}
                {(photo.exif?.aperture || photo.exif?.focal_length || photo.exif?.iso || photo.exif?.exposure_time) && (
                  <div className='exif-line'>
                    {[photo.exif.aperture, photo.exif.focal_length, photo.exif.iso, photo.exif.exposure_time]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
                {photo.caption && <div className='caption-text'>{photo.caption}</div>}
              </div>
            </div>
          </a>
        )}
      />
      <div className='view-all'>
        <a href='https://glass.photo/iam' target='_blank' rel='noopener noreferrer'>
          View more on Glass →
        </a>
      </div>
    </div>
  );
}
