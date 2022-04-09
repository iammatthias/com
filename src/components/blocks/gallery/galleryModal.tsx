// gallery

import Modal from '@/components/joy/modal';

export default function GalleryModal({
  children,
  images,
  imageKey,
  iframe,
}: any) {
  return (
    <Modal
      images={images ? images : null}
      imageKey={imageKey ? imageKey : null}
      iframe={iframe ? iframe : null}
    >
      {children}
    </Modal>
  );
}
