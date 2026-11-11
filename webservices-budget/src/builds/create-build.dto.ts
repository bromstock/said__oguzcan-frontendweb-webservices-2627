import { CreateBuildComponentDto } from '../build-components/create-build-component.dto';

export class CreateBuildDto {
  name: string;
  description?: string;
  user_id: number;
  components: Omit<CreateBuildComponentDto, 'build_id'>[];
}
