export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      financas: {
        Row: {
          atualizado_em: string
          categoria: string
          criado_em: string
          data_transacao: string
          descricao: string
          id: string
          recibo_nome: string | null
          recibo_url: string | null
          reparacao_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          categoria: string
          criado_em?: string
          data_transacao?: string
          descricao: string
          id?: string
          recibo_nome?: string | null
          recibo_url?: string | null
          reparacao_id?: string | null
          tipo: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          data_transacao?: string
          descricao?: string
          id?: string
          recibo_nome?: string | null
          recibo_url?: string | null
          reparacao_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financas_reparacao_id_fkey"
            columns: ["reparacao_id"]
            isOneToOne: false
            referencedRelation: "reparacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      motoristas: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_contratacao: string
          documento: string
          documento_bi_url: string | null
          documento_carta_url: string | null
          endereco: string | null
          id: string
          nome: string
          status: string
          telefone: string | null
          veiculo_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_contratacao: string
          documento: string
          documento_bi_url?: string | null
          documento_carta_url?: string | null
          endereco?: string | null
          id?: string
          nome: string
          status?: string
          telefone?: string | null
          veiculo_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_contratacao?: string
          documento?: string
          documento_bi_url?: string | null
          documento_carta_url?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          status?: string
          telefone?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motoristas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      reparacoes: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_reparacao: string
          descricao: string
          id: string
          oficina: string | null
          peca_substituida: string | null
          preco: number
          recibo_url: string | null
          status: string | null
          tipo: string
          veiculo_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_reparacao?: string
          descricao: string
          id?: string
          oficina?: string | null
          peca_substituida?: string | null
          preco: number
          recibo_url?: string | null
          status?: string | null
          tipo: string
          veiculo_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_reparacao?: string
          descricao?: string
          id?: string
          oficina?: string | null
          peca_substituida?: string | null
          preco?: number
          recibo_url?: string | null
          status?: string | null
          tipo?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reparacoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number
          atualizado_em: string
          criado_em: string
          id: string
          modelo: string
          placa: string
          status: string
        }
        Insert: {
          ano: number
          atualizado_em?: string
          criado_em?: string
          id?: string
          modelo: string
          placa: string
          status?: string
        }
        Update: {
          ano?: number
          atualizado_em?: string
          criado_em?: string
          id?: string
          modelo?: string
          placa?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
