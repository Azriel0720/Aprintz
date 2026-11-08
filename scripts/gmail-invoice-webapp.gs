function doPost(event) {
  try {
    const expectedToken = PropertiesService.getScriptProperties().getProperty('APRINTZ_INVOICE_TOKEN');
    const payload = JSON.parse(event.postData.contents);

    if (!expectedToken || payload.token !== expectedToken) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    if (
      typeof payload.to !== 'string' ||
      payload.to.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to) ||
      typeof payload.subject !== 'string' ||
      payload.subject.length > 200 ||
      typeof payload.text !== 'string' ||
      payload.text.length > 20000 ||
      typeof payload.html !== 'string' ||
      payload.html.length > 50000
    ) {
      return jsonResponse({ ok: false, error: 'Invalid payload' });
    }

    MailApp.sendEmail({
      to: payload.to,
      subject: payload.subject,
      body: payload.text,
      htmlBody: payload.html,
      name: 'APRINTZ',
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: 'Email could not be sent' });
  }
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
