/**
 * 전화번호를 마스킹하는 유틸리티 함수입니다.
 * @param phoneNumber - 마스킹할 전화번호
 * @returns 마스킹된 전화번호
 */
function isHyphenSeparated(phoneNumber: string) {
  return /^\d{2,3}-\d{3,4}-\d{4}$/.test(phoneNumber);
}

/**
 * 전화번호가 서울 지역번호(02)로 시작하는지 확인하는 함수입니다.
 * @param phoneNumber - 확인할 전화번호
 * @returns 서울 지역번호로 시작하면 true, 아니면 false
 */
function isSeoulPhoneNumber(phoneNumber: string) {
  return /^02\d+$/.test(phoneNumber);
}

/**
 * 특정 문자열을 "*"로 마스킹하는 함수입니다.
 * @param str - 마스킹할 문자열
 * @returns 마스킹된 문자열
 */
function maskAll(str: string) {
  return str.replace(/./g, '*');
}

/**
 * 전화번호를 마스킹하는 함수입니다.
 * @param phoneNumber - 마스킹할 전화번호
 * @returns 마스킹된 전화번호
 */
export const formatMaskPhoneNumber = (phoneNumber: string) => {
  if (isHyphenSeparated(phoneNumber)) {
    return phoneNumber.replace(
      /^(\d{2,3})-(\d{3,4})-(\d{4})$/,
      (_, p1, p2, p3) => `${p1}-${maskAll(p2)}-${p3}`
    );
  }

  if (isSeoulPhoneNumber(phoneNumber)) {
    return phoneNumber.replace(/^02(\d{3,4})(\d{4})/, (_, p1, p2) => `02${maskAll(p1)}${p2}`);
  }

  return phoneNumber.replace(
    /^(\d{3})(\d{3,4})(\d{4})/,
    (_, p1, p2, p3) => `${p1}${maskAll(p2)}${p3}`
  );
};
