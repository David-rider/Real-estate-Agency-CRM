// Lightweight RFC 4180 CSV parser + header auto-mapper for Client & Listing bulk imports.

export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n") {
      row.push(field.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

const CLIENT_HEADER_MAP: Record<string, string> = {
  firstname: "firstName", "first name": "firstName", first_name: "firstName", givenname: "firstName", "名": "firstName", "名字": "firstName", nombre: "firstName",
  lastname: "lastName", "last name": "lastName", last_name: "lastName", surname: "lastName", "姓": "lastName", "姓氏": "lastName", apellido: "lastName",
  fullname: "fullName", "full name": "fullName", name: "fullName", "client name": "fullName", "姓名": "fullName", "客户姓名": "fullName", "客戶姓名": "fullName",
  email: "email", "e-mail": "email", "email address": "email", "邮箱": "email", "电子邮件": "email", "電子郵件": "email", correo: "email",
  phone: "phone", "phone number": "phone", mobile: "phone", cell: "phone", tel: "phone", "电话": "phone", "手机": "phone", "電話": "phone", "手機": "phone", telefono: "phone", "teléfono": "phone",
  type: "type", "client type": "type", "类型": "type", "客户类型": "type", "類型": "type", tipo: "type",
  status: "status", "状态": "status", "狀態": "status", estado: "status",
  temperature: "temperature", priority: "temperature", "意向度": "temperature", "优先级": "temperature", "優先級": "temperature", prioridad: "temperature",
  budget: "budget", "search budget": "budget", "预算": "budget", "預算": "budget", presupuesto: "budget",
  source: "source", "lead source": "source", "来源": "source", "客户来源": "source", "來源": "source", origen: "source",
  tags: "tags", "标签": "tags", "標籤": "tags", etiquetas: "tags",
  notes: "notes", note: "notes", "备注": "notes", "備註": "notes", notas: "notes",
};

const PROPERTY_HEADER_MAP: Record<string, string> = {
  address: "address", "street address": "address", street: "address", "地址": "address", "房源地址": "address", "物件地址": "address", direccion: "address", "dirección": "address",
  city: "city", "城市": "city", ciudad: "city",
  state: "state", "州": "state", "省/州": "state", estado: "state",
  zip: "zip", zipcode: "zip", "zip code": "zip", postal: "zip", "邮编": "zip", "郵遞區號": "zip", "código postal": "zip",
  price: "price", "list price": "price", "asking price": "price", "价格": "price", "售价": "price", "價格": "price", "售價": "price", precio: "price",
  beds: "beds", bedrooms: "beds", br: "beds", "卧室": "beds", "卧": "beds", "房": "beds", "房間": "beds", habitaciones: "beds",
  baths: "baths", bathrooms: "baths", ba: "baths", "卫浴": "baths", "卫": "baths", "衛": "baths", "衛浴": "baths", "baños": "baths", banos: "baths",
  sqft: "sqft", "square feet": "sqft", "sq ft": "sqft", area: "sqft", "面积": "sqft", "平方英尺": "sqft", "面積": "sqft",
  status: "status", "状态": "status", "狀態": "status",
  propertytype: "propertyType", "property type": "propertyType", type: "propertyType", "房源类型": "propertyType", "物件類型": "propertyType", tipo: "propertyType",
  neighborhood: "neighborhood", "社区": "neighborhood", "商圈": "neighborhood", "社區": "neighborhood", barrio: "neighborhood",
  mls: "mlsNumber", mlsnumber: "mlsNumber", "mls number": "mlsNumber", "mls#": "mlsNumber", "mls编号": "mlsNumber",
  description: "description", "描述": "description", "房源描述": "description", "物件描述": "description", "descripción": "description",
};

export function mapClientCsvRows(matrix: string[][]): Record<string, string>[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0].map((h) => CLIENT_HEADER_MAP[h.toLowerCase().trim()] || h.trim());
  return matrix.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((key, idx) => {
      if (key && cols[idx] !== undefined && cols[idx] !== "") obj[key] = cols[idx];
    });
    return obj;
  });
}

export function mapPropertyCsvRows(matrix: string[][]): Record<string, string>[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0].map((h) => PROPERTY_HEADER_MAP[h.toLowerCase().trim()] || h.trim());
  return matrix.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((key, idx) => {
      if (key && cols[idx] !== undefined && cols[idx] !== "") obj[key] = cols[idx];
    });
    return obj;
  });
}

export function downloadCsvTemplate(filename: string, csvContent: string) {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
