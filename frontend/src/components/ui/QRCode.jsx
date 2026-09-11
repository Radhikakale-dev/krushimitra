import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Renders a QR code for a given string (usually a URL to a bill or payment link)
 */
const QRCode = ({ value, size = 128, includeMargin = true }) => {
  if (!value) return null;

  return (
    <div className="bg-white p-2 rounded-lg inline-block">
      <QRCodeSVG
        value={value}
        size={size}
        level={"M"}
        includeMargin={includeMargin}
      />
    </div>
  );
};

export default QRCode;
