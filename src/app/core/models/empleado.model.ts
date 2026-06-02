export interface Empleado {
  id_empleado: number;
  cedula: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion: string;
  puesto: string;
  salario_base: string;
  fecha_ingreso: string;
  estado: boolean;
  id_departamento: number;
  departamento: string;
}